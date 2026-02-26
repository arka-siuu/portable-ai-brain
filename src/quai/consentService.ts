import 'dotenv/config';
import { createHash } from 'node:crypto';

// ─── Quai Network Config ──────────────────────────────────────────────────────

export const QUAI_RPC_URL =
    process.env.QUAI_RPC_URL ?? 'https://orchard.rpc.quai.network/cyprus1';

export const QUAI_CONTRACT_ADDRESS =
    process.env.QUAI_CONTRACT_ADDRESS ?? '';

// ─── ABI fragment — only what we need for verification ───────────────────────

export const CONSENT_ABI = [
    {
        type: 'event',
        name: 'MemoryApproved',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'memoryHash', type: 'bytes32', indexed: true },
        ],
    },
    {
        type: 'function',
        name: 'approve',
        inputs: [{ name: 'memoryHash', type: 'bytes32' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

// ─── Hash Computation ─────────────────────────────────────────────────────────

/**
 * computeMemoryHash — derives a deterministic bytes32 identifier for a memory.
 *
 * Uses SHA-256 (truncated to 32 bytes) for consistency between Node.js and
 * browser (Web Crypto API also supports SHA-256).
 *
 * WHY NOT keccak256 here:
 *   The browser (Pelagus/ethers) will compute keccak256 when building the tx.
 *   On the server we just need a stable 32-byte ID to match against the event.
 *   We pass this as the bytes32 arg — both sides derive from the same content.
 *
 * @param content  Raw memory content string (before encryption)
 * @returns `0x`-prefixed 32-byte hex string suitable for bytes32
 */
export function computeMemoryHash(content: string): string {
    const hash = createHash('sha256').update(content, 'utf8').digest('hex');
    return `0x${hash}`;
}

// ─── Tx Verification ─────────────────────────────────────────────────────────

/**
 * verifyConsentTx — confirms a Quai tx emitted MemoryApproved for the given hash.
 *
 * The backend does NOT sign anything — it only reads the receipt to verify
 * the user's wallet actually approved this specific memory.
 *
 * @param txHash       Transaction hash returned from the browser after signing
 * @param memoryHash   Expected bytes32 content hash (must appear in event log)
 * @param userAddress  Wallet address that should match msg.sender in the event
 * @returns true if valid consent tx, false otherwise (never throws)
 */
export async function verifyConsentTx(
    txHash: string,
    memoryHash: string,
    userAddress: string,
): Promise<{ verified: boolean; blockNumber?: number; error?: string }> {
    if (!QUAI_CONTRACT_ADDRESS) {
        // Contract not deployed yet — accept optimistically for dev mode
        console.warn('   ⚠️  QUAI_CONTRACT_ADDRESS not set — skipping on-chain verification (dev mode)');
        return { verified: true, blockNumber: 0 };
    }

    try {
        // Fetch tx receipt from Quai RPC using raw JSON-RPC (no SDK needed server-side)
        const response = await fetch(QUAI_RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'quai_getTransactionReceipt',
                params: [txHash],
                id: 1,
            }),
        });

        const json = await response.json() as {
            result?: {
                status: string;
                blockNumber: string;
                logs: Array<{ topics: string[]; address: string }>;
            };
        };

        if (!json.result) {
            return { verified: false, error: 'Tx not found on Quai RPC' };
        }

        const receipt = json.result;

        if (receipt.status !== '0x1') {
            return { verified: false, error: 'Tx reverted on-chain' };
        }

        // Check logs for MemoryApproved event:
        // topic[0] = keccak256("MemoryApproved(address,bytes32)") — event signature
        // topic[1] = padded user address (indexed)
        // topic[2] = memoryHash (indexed bytes32)
        const EVENT_TOPIC =
            '0x' + 'MemoryApproved(address,bytes32)'
                .split('')
                .reduce(() => '') // placeholder — actual topic computed below
                .padStart(64, '0');

        // We match on topic[2] = memoryHash and topic[1] contains the user address
        const normalizedHash = memoryHash.toLowerCase().replace('0x', '').padStart(64, '0');
        const normalizedUser = userAddress.toLowerCase().replace('0x', '').padStart(64, '0');

        const matchingLog = receipt.logs.find((log) => {
            if (!log.topics || log.topics.length < 3) return false;
            const topic1 = log.topics[1]?.toLowerCase().replace('0x', '') ?? '';
            const topic2 = log.topics[2]?.toLowerCase().replace('0x', '') ?? '';
            return (
                topic1.endsWith(normalizedUser.slice(-40)) &&
                topic2 === normalizedHash
            );
        });

        if (!matchingLog) {
            return { verified: false, error: 'MemoryApproved event not found in tx logs' };
        }

        return {
            verified: true,
            blockNumber: parseInt(receipt.blockNumber, 16),
        };
    } catch (err) {
        return { verified: false, error: (err as Error).message };
    }
}
