/**
 * demoConsentService.ts
 *
 * Simulates Quai consent locally for smooth hackathon demos.
 * When DEMO_CONSENT_MODE=true, the owner wallet acts as permanent consent
 * authority — no Pelagus popup, no pending queue delay.
 *
 * The Quai consent ARCHITECTURE is fully preserved:
 *   - memoryHash is still computed
 *   - approvedBy is still a wallet address
 *   - timestamp and mode are logged
 *
 * Only the runtime on-chain signing step is bypassed.
 * In production (DEMO_CONSENT_MODE=false) the real Pelagus flow is used.
 */

export const DEMO_CONSENT_MODE =
    (process.env.DEMO_CONSENT_MODE ?? 'true').toLowerCase() === 'true';

export const OWNER_WALLET_ADDRESS =
    process.env.OWNER_WALLET_ADDRESS ?? '0x0036Cf51C8D73436710cea32BDD6Ac070453783D';

export interface ConsentRecord {
    approved: boolean;
    approvedBy: string;
    timestamp: number;
    mode: 'demo' | 'live';
    memoryHash: string;
}

/**
 * approveMemory — issues a local consent record for a memory.
 *
 * In demo mode: instant approval, no wallet interaction.
 * In live mode: this function is NOT called — the Pelagus flow handles it.
 */
export function approveMemory(memoryHash: string): ConsentRecord {
    return {
        approved: true,
        approvedBy: OWNER_WALLET_ADDRESS,
        timestamp: Date.now(),
        mode: 'demo',
        memoryHash,
    };
}

/**
 * formatConsentLog — produces the log line for the DataHaven activity panel.
 */
export function formatConsentLog(record: ConsentRecord): string {
    const shortAddr = `${record.approvedBy.slice(0, 8)}…${record.approvedBy.slice(-4)}`;
    return `✅ Consent authorized by owner wallet ${shortAddr} (Demo Mode)`;
}
