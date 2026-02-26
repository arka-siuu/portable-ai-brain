import type { MemoryEvent } from './memoryTypes.js';

// ─── Context Distillation Algorithm ───────────────────────────────────────────
//
// WHY DISTILLATION IS REQUIRED
// LLM context windows are finite (4k–128k tokens depending on provider).
// Injecting all memories would either:
//   a) overflow the context window → hard error
//   b) dilute the relevant signal with noise → worse responses
//
// Distillation selects ONLY the memories most relevant to the current prompt.
// This keeps context lean, deterministic, and provider-portable.
// ──────────────────────────────────────────────────────────────────────────────

const MAX_CONTEXT_CHARS = 2000; // proxy for ~500 tokens at average 4 chars/token
const TOP_N_DEFAULT = 3;

/**
 * DistilledContext — output of the distillation step.
 */
export interface DistilledContext {
    prompt: string;
    selected: MemoryEvent[];
    context: string;    // formatted string ready to inject into an LLM prompt
    totalMemories: number;
    selectedCount: number;
}

/**
 * scoreMemory — scores a single memory against a user prompt.
 *
 * Algorithm:
 *   1. Tokenize prompt into lowercase words (split on non-alphanumeric)
 *   2. For each memory: count overlapping words between prompt tokens and:
 *        - memory.tags (weight x2 — tags are explicitly indexed for search)
 *        - memory.content words (weight x1)
 *   3. Score = tag_hits * 2 + content_hits
 *
 * Rationale: tags are curated keywords, so they signal stronger relevance
 * than incidental word matches in content.
 */
function scoreMemory(memory: MemoryEvent, promptTokens: Set<string>): number {
    let score = 0;

    // Tag matching (higher weight — tags are the semantic index)
    for (const tag of memory.tags) {
        const tagWords = tokenize(tag);
        for (const word of tagWords) {
            if (promptTokens.has(word)) score += 2;
        }
    }

    // Content matching (lower weight — surface-level relevance)
    const contentWords = tokenize(memory.content);
    for (const word of contentWords) {
        if (promptTokens.has(word)) score += 1;
    }

    return score;
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 2); // ignore stop-words shorter than 3 chars
}

/**
 * distillContext — selects the top N most relevant memories for the prompt.
 *
 * @param prompt    — the user's question or input
 * @param memories  — all MemoryEvents in the brain
 * @param topN      — maximum number of memories to include (default 3)
 * @returns DistilledContext with formatted string for LLM injection
 */
export function distillContext(
    prompt: string,
    memories: MemoryEvent[],
    topN: number = TOP_N_DEFAULT,
): DistilledContext {
    if (memories.length === 0) {
        return {
            prompt,
            selected: [],
            context: '(no memories available)',
            totalMemories: 0,
            selectedCount: 0,
        };
    }

    const promptTokens = new Set(tokenize(prompt));

    // Score and rank all memories
    const scored = memories
        .map((m) => ({ memory: m, score: scoreMemory(m, promptTokens) }))
        .sort((a, b) => b.score - a.score);

    // Take top N — even if score is 0 we still include (recency fallback)
    const selected = scored.slice(0, topN).map((s) => s.memory);

    // Format selected memories into a compact context string
    const lines: string[] = [
        '=== USER MEMORY CONTEXT (from personal DataHaven brain) ===',
    ];

    for (const m of selected) {
        lines.push(`[${m.type.toUpperCase()}] ${m.content}`);
        if (m.tags.length > 0) lines.push(`  tags: ${m.tags.join(', ')}`);
    }

    lines.push('=== END MEMORY CONTEXT ===');

    let context = lines.join('\n');

    // Hard cap at MAX_CONTEXT_CHARS to guarantee context window safety
    if (context.length > MAX_CONTEXT_CHARS) {
        context = context.slice(0, MAX_CONTEXT_CHARS - 3) + '...';
    }

    return {
        prompt,
        selected,
        context,
        totalMemories: memories.length,
        selectedCount: selected.length,
    };
}
