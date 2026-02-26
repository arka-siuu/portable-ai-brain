import 'dotenv/config';
import '@storagehub/api-augment';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initWasm } from '@storagehub-sdk/core';

import { PROVIDERS, chatWithProvider, type ChatMessage } from '../llm/groqClient.js';
import { extractMemories } from '../llm/memoryExtractor.js';
import { buildMemorySystemPrompt, buildStatelessSystemPrompt } from '../llm/contextBuilder.js';
import { authenticateUser } from '../datahaven/mspService.js';
import { createBrainBucket, waitForBackendBucketReady } from '../datahaven/bucketService.js';
import { storeMemory, retrieveMemory } from '../datahaven/memoryStorage.js';
import { polkadotApi } from '../datahaven/clientService.js';
import type { MemoryEvent, StoredMemoryRef } from '../memory/memoryTypes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT ?? '3000', 10);
const BRAIN_BUCKET_NAME = process.env.BRAIN_BUCKET_NAME ?? 'portable-ai-brain';

// ─── Server State (in-memory, cleared on restart or via API) ──────────────────

// Chat histories per provider — purely local, never stored on DataHaven
const chatHistories = new Map<string, ChatMessage[]>();

// All memory refs stored in this session
const storedRefs: StoredMemoryRef[] = [];

// Known memory file keys (persisted across calls — loaded on startup)
let allMemoryRefs: StoredMemoryRef[] = [];

// Activity log — shown in the UI's DataHaven panel
const activityLog: string[] = [];

// Brain bucket ID (resolved once at startup)
let bucketId: string | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string, type: 'info' | 'success' | 'memory' | 'chain' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
    const entry = `[${timestamp}] ${msg}`;
    activityLog.unshift(entry); // newest first
    if (activityLog.length > 100) activityLog.pop();
    console.log(`  ${msg}`);
}

function getHistory(model: string): ChatMessage[] {
    if (!chatHistories.has(model)) chatHistories.set(model, []);
    return chatHistories.get(model)!;
}

// ─── DataHaven Bootstrap ───────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
    console.log('\n🧠 Portable AI Brain — Starting Server...');
    console.log('🔗 Connecting to DataHaven testnet...\n');

    await initWasm();
    log('✅ WASM initialized');

    await authenticateUser();
    log('✅ Authenticated with MSP via SIWE');

    const result = await createBrainBucket(BRAIN_BUCKET_NAME);
    bucketId = result.bucketId;

    if (!result.alreadyExists) {
        log(`🆕 Brain bucket created: ${bucketId}`);
        await waitForBackendBucketReady(bucketId);
        log('✅ MSP indexed brain bucket');
    } else {
        log(`♻️  Reusing existing brain bucket: ${bucketId}`);
    }

    log(`🧠 Brain vault ready — bucket: ${bucketId}`);
    console.log(`\n✅ Server ready → http://localhost:${PORT}\n`);
}

// ─── Express App ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../../public')));

// ── GET /api/providers ────────────────────────────────────────────────────────
app.get('/api/providers', (_req, res) => {
    res.json(PROVIDERS);
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        bucketId,
        memoryCount: allMemoryRefs.length,
    });
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
    res.json({
        bucketId,
        memoryCount: allMemoryRefs.length,
        refs: allMemoryRefs.map((r) => ({
            memoryId: r.memoryId,
            fileKey: r.fileKey,
            fingerprint: r.fingerprint,
            storedAt: r.storedAt,
        })),
        log: activityLog.slice(0, 30),
    });
});

// ── GET /api/log ──────────────────────────────────────────────────────────────
app.get('/api/log', (_req, res) => {
    res.json(activityLog.slice(0, 50));
});

// ── POST /api/clear ───────────────────────────────────────────────────────────
// Clears chat history for a provider. Memories on DataHaven are NOT touched.
app.post('/api/clear', (req, res) => {
    const { model } = req.body as { model: string };
    if (model === 'all') {
        chatHistories.clear();
        log('🧹 All chat histories cleared (brain vault intact on DataHaven)');
    } else {
        chatHistories.delete(model);
        log(`🧹 Chat history cleared for ${model} (brain vault intact)`);
    }
    res.json({ ok: true });
});

// ── POST /api/chat ─────────────────────────────────────────────────────────────
// The main endpoint. Full pipeline:
//   1. Build chat context (with or without brain)
//   2. Call Groq LLM
//   3. Background: extract + store memories
app.post('/api/chat', async (req, res) => {
    const { model, userMessage, loadBrain } = req.body as {
        model: string;
        userMessage: string;
        loadBrain: boolean;
    };

    if (!model || !userMessage) {
        res.status(400).json({ error: 'model and userMessage are required' });
        return;
    }

    if (!bucketId) {
        res.status(503).json({ error: 'Brain bucket not ready yet — server is still initializing' });
        return;
    }

    const history = getHistory(model);
    const extractedMemories: MemoryEvent[] = [];
    const newRefs: StoredMemoryRef[] = [];
    let systemPrompt: string;
    let memoryCount = 0;

    try {
        // ── Step 1: Build system prompt ──────────────────────────────────────────
        if (loadBrain && allMemoryRefs.length > 0) {
            log(`🔍 Loading brain for prompt: "${userMessage.slice(0, 40)}..."`);
            const allMemories: MemoryEvent[] = [];

            for (const ref of allMemoryRefs) {
                try {
                    const mem = await retrieveMemory(ref.fileKey);
                    allMemories.push(mem);
                } catch {
                    // Skip memories that aren't available yet (indexing delay)
                }
            }

            memoryCount = allMemories.length;
            systemPrompt = buildMemorySystemPrompt(userMessage, allMemories);
            log(`📦 Injecting ${memoryCount} memories into context`);
        } else if (loadBrain && allMemoryRefs.length === 0) {
            log('🧠 Brain is ON but no memories stored yet — responding without context');
            systemPrompt = buildStatelessSystemPrompt();
        } else {
            log(`🚫 Brain OFF — stateless response for "${userMessage.slice(0, 40)}..."`);
            systemPrompt = buildStatelessSystemPrompt();
        }

        // ── Step 2: Add user message to history + call LLM ──────────────────────
        history.push({ role: 'user', content: userMessage });
        const reply = await chatWithProvider(model, history, systemPrompt);
        history.push({ role: 'assistant', content: reply });

        log(`💬 [${model.split('/').pop()}] replied (${reply.length} chars)`);

        // ── Step 3: Background — extract + store memories ────────────────────────
        // This does NOT block the HTTP response.
        setImmediate(async () => {
            try {
                const memories = await extractMemories(userMessage, reply);
                if (memories.length > 0) {
                    for (const memory of memories) {
                        log(`🧠 Memory extracted: [${memory.type.toUpperCase()}] "${memory.content.slice(0, 50)}"`, 'memory');
                        try {
                            const ref = await storeMemory(bucketId!, memory);
                            allMemoryRefs.push(ref);
                            newRefs.push(ref);
                            log(`🧾 Fingerprint: ${ref.fingerprint}`, 'chain');
                            log(`🔑 fileKey: ${ref.fileKey}`, 'chain');
                            log(`✅ Stored on DataHaven`, 'success');
                        } catch (storeErr) {
                            log(`❌ Store failed: ${(storeErr as Error).message}`, 'error');
                        }
                    }
                }
            } catch (extractErr) {
                log(`⚠️ Extraction failed: ${(extractErr as Error).message}`, 'error');
            }
        });

        // ── Step 4: Respond immediately ──────────────────────────────────────────
        res.json({
            reply,
            model,
            loadBrain,
            memoryCount,
            historyLength: history.length,
        });

    } catch (err) {
        const msg = (err as Error).message;
        log(`❌ Chat error: ${msg}`, 'error');
        res.status(500).json({ error: msg });
    }
});

// ─── Start ─────────────────────────────────────────────────────────────────────

bootstrap()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`\n🌐 Open your browser → http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Bootstrap failed:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', () => {
    polkadotApi.disconnect().finally(() => process.exit(0));
});
