import { distillContext } from '../memory/distiller.js';
import type { MemoryEvent } from '../memory/memoryTypes.js';

// ─── Context Builder ────────────────────────────────────────────────────────────
//
// This is the bridge between DataHaven storage and the LLM system prompt.
// It uses the existing distiller to select the most relevant memories,
// then formats them into a system prompt the LLM can consume.
//
// KEY PRINCIPLE: The LLM is stateless. It only knows the user because
// we inject context from DataHaven. Remove the context → LLM knows nothing.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * buildMemorySystemPrompt — creates the LLM system prompt when brain is ON.
 *
 * @param userPrompt — current user message (used for relevance scoring)
 * @param memories   — all decrypted memories from DataHaven
 * @returns system prompt string with injected context
 */
export function buildMemorySystemPrompt(
    userPrompt: string,
    memories: MemoryEvent[],
): string {
    const distilled = distillContext(userPrompt, memories, 5);

    return [
        'You are a helpful AI assistant.',
        'You have been given the user\'s personal memory context below.',
        'Use it to personalize your response. If the context mentions their name, use it.',
        'Be natural — don\'t explicitly say "according to your memory". Just know it.',
        '',
        distilled.context,
        '',
        'Respond naturally to the user, using the above context to personalize.',
    ].join('\n');
}

/**
 * buildStatelessSystemPrompt — used when brain is OFF.
 *
 * Explicitly tells the model it has no prior knowledge of the user.
 * This makes the "Brain OFF" state clearly different from "Brain ON".
 */
export function buildStatelessSystemPrompt(): string {
    return [
        'You are a helpful AI assistant.',
        'You have no prior knowledge of this user.',
        'Answer based only on what they tell you in this conversation.',
    ].join('\n');
}
