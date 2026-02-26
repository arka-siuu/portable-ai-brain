import {
    storageHubClient,
    address,
    publicClient,
    polkadotApi,
} from './clientService.js';
import { getMspInfo, getValueProps, mspClient } from './mspService.js';

// ─── Bucket creation ───────────────────────────────────────────────────────────

/**
 * createBrainBucket — issues an on-chain bucket creation transaction.
 *
 * DataHaven requires:
 *   - mspId  : identifies which Main Storage Provider holds this bucket
 *   - valuePropId: the pricing tier for files stored in this bucket
 *   - bucketName : human-readable label (deterministically hashed to bucket ID)
 *
 * Returns { bucketId, txReceipt } after the transaction is finalized.
 *
 * ⚠️  Throws if the bucket already exists (idempotent guard built-in).
 *     The caller can use or-exists semantics for re-runs.
 */
export async function createBrainBucket(bucketName: string): Promise<{
    bucketId: string;
    alreadyExists: boolean;
}> {
    const { mspId } = await getMspInfo();
    const valuePropId = await getValueProps();

    // Derive the deterministic bucket ID from our address + name
    const bucketId = (await storageHubClient.deriveBucketId(
        address,
        bucketName,
    )) as string;
    console.log(`   Derived bucket ID: ${bucketId}`);

    // Check if bucket already exists on-chain (idempotent re-run support)
    const existing = await polkadotApi.query.providers.buckets(bucketId);
    if (!existing.isEmpty) {
        console.log(`   ⚠️  Bucket already exists on-chain — reusing ${bucketId}`);
        return { bucketId, alreadyExists: true };
    }

    const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
        mspId as `0x${string}`,
        bucketName,
        false, // isPrivate = false (fingerprint visible, content encrypted client-side)
        valuePropId,
    );

    if (!txHash) throw new Error('createBucket() returned no transaction hash');
    console.log(`   📝 Bucket creation tx: ${txHash}`);

    const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (txReceipt.status !== 'success') {
        throw new Error(`Bucket creation failed: ${txHash}`);
    }

    console.log(`   ✅ Bucket created on-chain: ${bucketId}`);
    return { bucketId, alreadyExists: false };
}

// ─── On-chain verification ─────────────────────────────────────────────────────

/**
 * verifyBucketOnChain — reads the bucket from on-chain state and validates it.
 *
 * DataHaven's Merkle tree tracks every bucket via `polkadotApi.query.providers.buckets()`.
 * A non-empty result means the bucket is committed to the chain.
 *
 * The Merkle root inside the bucket record proves which files belong to it.
 * Any file upload changes the Merkle root — this is DataHaven's verifiable state model.
 */
export async function verifyBucketOnChain(bucketId: string): Promise<{
    root: string;
    userId: string;
    mspId: string;
    size: string;
}> {
    const bucket = await polkadotApi.query.providers.buckets(bucketId);
    if (bucket.isEmpty) throw new Error(`Bucket not found on-chain: ${bucketId}`);

    const data = bucket.unwrap().toHuman() as {
        root: string;
        userId: string;
        mspId: string;
        size_: string;
    };

    console.log(`   🧾 Merkle root (current state): ${data.root}`);
    console.log(`   Owner matches wallet: ${data.userId?.toLowerCase() === address.toLowerCase()}`);

    return {
        root: data.root,
        userId: data.userId,
        mspId: data.mspId,
        size: data.size_,
    };
}

// ─── Backend polling ───────────────────────────────────────────────────────────

/**
 * waitForBackendBucketReady — polls the MSP until it has indexed the new bucket.
 *
 * DataHaven's indexer processes blocks asynchronously. After creating a bucket on-chain,
 * the MSP backend needs a few seconds to sync. If we upload immediately, the MSP
 * returns 404 for the bucket. This function waits up to 30 seconds before giving up.
 */
export async function waitForBackendBucketReady(bucketId: string): Promise<void> {
    const maxAttempts = 15;
    const delayMs = 2000;

    for (let i = 0; i < maxAttempts; i++) {
        console.log(`   ⏳ Waiting for MSP to index bucket (attempt ${i + 1}/${maxAttempts})...`);
        try {
            const bucket = await mspClient.buckets.getBucket(bucketId);
            if (bucket) {
                console.log(`   ✅ MSP has indexed the bucket`);
                return;
            }
        } catch (error: unknown) {
            const e = error as { status?: number; body?: { error?: string } };
            if (e?.status === 404 || e?.body?.error === 'Not found: Record') {
                // Expected — MSP just hasn't caught up yet
            } else {
                throw error;
            }
        }
        await new Promise((r) => setTimeout(r, delayMs));
    }
    throw new Error(`Bucket ${bucketId} not indexed by MSP after waiting`);
}
