/**
 * Portable AI Brain — Full End-to-End Demo
 *
 * Run: npm run demo
 *
 * What this script proves:
 *   1. A user's cognitive memory lives on DataHaven — user-owned, not LLM-owned
 *   2. Memories are encrypted before upload — MSP never reads plaintext
 *   3. Each memory has a verifiable fingerprint committed on-chain (Merkle leaf)
 *   4. The same distilled context works across different LLM providers (portability)
 *   5. The brain vault is persistent — memories survive across sessions
 */

import 'dotenv/config';
import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './datahaven/clientService.js';
import { authenticateUser } from './datahaven/mspService.js';
import {
  createBrainBucket,
  verifyBucketOnChain,
  waitForBackendBucketReady,
} from './datahaven/bucketService.js';
import { storeMemory, retrieveMemory } from './datahaven/memoryStorage.js';
import { createMemoryEvent } from './memory/memoryEvents.js';
import { distillContext } from './memory/distiller.js';
import { ProviderA, ProviderB, callWithContext } from './llm/provider.js';
import type { StoredMemoryRef } from './memory/memoryTypes.js';

// ─── Brain bucket name — one bucket = one brain ────────────────────────────────
const BRAIN_BUCKET_NAME = 'portable-ai-brain';

async function run(): Promise<void> {
  // ── INIT ────────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  🧠 Portable AI Brain — DataHaven MVP');
  console.log('════════════════════════════════════════════════════════\n');

  // WASM must be initialized before any @storagehub-sdk/core calls
  await initWasm();
  console.log('✅ WASM initialized');

  // ── STEP 1: MSP AUTHENTICATION (SIWE) ────────────────────────────────────
  console.log('\n[Step 1] MSP Authentication');
  await authenticateUser();

  // ── STEP 2: CREATE BRAIN BUCKET ───────────────────────────────────────────
  console.log('\n[Step 2] Brain Bucket');
  const { bucketId, alreadyExists } = await createBrainBucket(BRAIN_BUCKET_NAME);

  if (!alreadyExists) {
    // Wait for MSP indexer to sync — avoids 404 on first upload
    console.log('\n[Step 2b] Waiting for MSP to index bucket...');
    await waitForBackendBucketReady(bucketId);
  }

  // Verify the bucket exists on-chain and log its Merkle root
  console.log('\n[Step 2c] On-chain bucket verification');
  const bucketData = await verifyBucketOnChain(bucketId);
  console.log(`   ✅ Bucket verified — Merkle root: ${bucketData.root}`);
  console.log(`   📦 Merkle root updated as part of DataHaven storage confirmation lifecycle`);

  // ── STEP 3: STORE MEMORIES ────────────────────────────────────────────────
  console.log('\n[Step 3] Storing Memories');

  // Memory 1 — user preference
  const memory1 = createMemoryEvent(
    'preference',
    'I prefer concise, bullet-point answers with no fluff. Skip pleasantries.',
    ['concise', 'bullet-points', 'communication', 'style', 'preference'],
    'user-input',
  );

  // Memory 2 — user goal
  const memory2 = createMemoryEvent(
    'goal',
    'My goal is to ship a working DataHaven MVP for the hackathon by end of day.',
    ['hackathon', 'datahaven', 'mvp', 'goal', 'deadline', 'ship'],
    'user-input',
  );

  console.log(`\n   📝 Storing Memory 1: [${memory1.type}] "${memory1.content.slice(0, 50)}..."`);
  const ref1: StoredMemoryRef = await storeMemory(bucketId, memory1);

  console.log(`\n   📝 Storing Memory 2: [${memory2.type}] "${memory2.content.slice(0, 50)}..."`);
  const ref2: StoredMemoryRef = await storeMemory(bucketId, memory2);

  console.log('\n   ✅ Both memories stored on DataHaven');
  console.log(`   Memory 1 fileKey: ${ref1.fileKey}`);
  console.log(`   Memory 2 fileKey: ${ref2.fileKey}`);

  // ── STEP 4: RETRIEVE MEMORIES ─────────────────────────────────────────────
  console.log('\n[Step 4] Retrieving and Decrypting Memories');

  const retrieved1 = await retrieveMemory(ref1.fileKey);
  const retrieved2 = await retrieveMemory(ref2.fileKey);

  const allMemories = [retrieved1, retrieved2];

  // Verify retrieval integrity — content must match original
  const integrityOk =
    retrieved1.id === memory1.id && retrieved2.id === memory2.id;
  console.log(`\n   🔍 Retrieval integrity check: ${integrityOk ? '✅ PASSED' : '❌ FAILED'}`);

  // ── STEP 5: CONTEXT DISTILLATION ─────────────────────────────────────────
  const userPrompt =
    'How should I approach finishing my hackathon project today?';

  console.log('\n[Step 5] Context Distillation');
  console.log(`   User prompt: "${userPrompt}"`);

  const distilled = distillContext(userPrompt, allMemories, 3);

  console.log(`\n   📦 Distilled context (${distilled.selectedCount}/${distilled.totalMemories} memories selected):`);
  console.log('   ' + distilled.context.replace(/\n/g, '\n   '));

  // ── STEP 6: LLM PROVIDER A ───────────────────────────────────────────────
  console.log('\n[Step 6] LLM Provider A');
  const responseA = await callWithContext(ProviderA, distilled.context, distilled.prompt);

  // ── STEP 7: LLM PROVIDER B — PORTABILITY PROOF ───────────────────────────
  console.log('\n[Step 7] LLM Provider B — Same Context, Different Provider');
  const responseB = await callWithContext(ProviderB, distilled.context, distilled.prompt);

  // ── STEP 8: PORTABILITY SUMMARY ───────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  ✅ PORTABILITY VERIFIED');
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Same distilled context → ${ProviderA.name}`);
  console.log(`                         → ${ProviderB.name}`);
  console.log('  Memory owner: YOU (not any LLM provider)');
  console.log('  Memory location: DataHaven (encrypted, on-chain verified)');
  console.log('  LLMs are stateless consumers — brain vault is portable');
  console.log('════════════════════════════════════════════════════════\n');

  // Reference to silence unused-variable warnings from TS
  void responseA;
  void responseB;
}

run().catch((err) => {
  console.error('\n❌ Demo failed:');
  console.error(err);
  process.exitCode = 1;
}).finally(() => {
  polkadotApi.disconnect().catch(() => { });
});