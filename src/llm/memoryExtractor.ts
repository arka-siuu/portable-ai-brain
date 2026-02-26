import { groq } from './groqClient.js';
import { createMemoryEvent } from '../memory/memoryEvents.js';
import type { MemoryEvent } from '../memory/memoryTypes.js';

// ─── Memory Extraction Agent ────────────────────────────────────────────────────
//
// This runs AFTER every user–assistant turn as a non-blocking background call.
// It uses a small fast model (llama-3.1-8b-instant) as an extraction agent.
// The user never waits for this — it fires and stores asynchronously.
//
// WHAT IT EXTRACTS:
//   preference — "I like/prefer/hate X"
//   goal       — "I want to / I am trying to X"
//   fact       — Stable personal facts: name, role, language, location
//
// WHAT IT IGNORES:
//   - One-time tasks ("can you summarize this?")
//   - Greetings and small talk
//   - Transient queries ("what's 2+2?")
// ──────────────────────────────────────────────────────────────────────────────

const EXTRACTOR_SYSTEM_PROMPT = `You are a memory extraction agent for a personal AI brain.

Given a USER message and ASSISTANT reply, extract ONLY stable, durable personal memories.

Rules:
- Extract: names, preferences, long-term goals, stable personal facts
- IGNORE: one-time tasks, greetings, math questions, transient queries
- If nothing durable, return []
- Deduplicate: if same fact appears, include it only once

Return ONLY valid JSON array, no other text:
[
  {"type": "fact"|"preference"|"goal", "content": "...", "tags": ["tag1", "tag2"]}
]

Examples of GOOD extraction:
User: "Hi I'm Arkaprava" → [{"type":"fact","content":"User's name is Arkaprava","tags":["name","identity"]}]
User: "I love dark mode" → [{"type":"preference","content":"User prefers dark mode in applications","tags":["dark-mode","ui","preference"]}]
User: "I'm building a DataHaven MVP" → [{"type":"goal","content":"User is building a DataHaven MVP","tags":["datahaven","mvp","goal"]}]

Examples of BAD extraction (do NOT extract):
User: "What is 2+2?" → []
User: "Summarize this text" → []
User: "Hello" → []`;

/**
 * extractMemories — background agent that finds durable memories in each chat turn.
 *
 * Returns an empty array if no memories found (most turns produce nothing —
 * this is intentional, it prevents memory pollution).
 */
export async function extractMemories(
    userMessage: string,
    assistantReply: string,
): Promise<MemoryEvent[]> {
    try {
        const prompt = `USER said: "${userMessage}"\nASSISTANT replied: "${assistantReply.slice(0, 300)}"\n\nExtract durable memories:`;

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant', // Use fast model for extraction
            messages: [
                { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.1, // Low temperature for consistent structured output
            max_tokens: 400,
        });

        const raw = response.choices[0]?.message?.content?.trim() ?? '[]';

        // Parse and validate the JSON response
        const extracted = parseExtractedMemories(raw);
        return extracted.map((m) =>
            createMemoryEvent(m.type, m.content, m.tags, 'llm-extracted'),
        );
    } catch (err) {
        // Memory extraction is non-critical — log and continue
        console.error('   ⚠️ Memory extraction failed (non-critical):', (err as Error).message);
        return [];
    }
}

// ─── Parse helper ───────────────────────────────────────────────────────────────

interface RawExtracted {
    type: 'preference' | 'goal' | 'fact';
    content: string;
    tags: string[];
}

function parseExtractedMemories(raw: string): RawExtracted[] {
    try {
        // Strip potential markdown code fences
        const cleaned = raw
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) return [];

        return parsed.filter(
            (item): item is RawExtracted =>
                typeof item === 'object' &&
                item !== null &&
                ['preference', 'goal', 'fact'].includes(item.type) &&
                typeof item.content === 'string' &&
                item.content.length > 0 &&
                Array.isArray(item.tags),
        );
    } catch {
        return [];
    }
}
