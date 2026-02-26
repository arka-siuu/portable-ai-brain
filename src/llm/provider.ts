// ─── LLM Provider Abstraction ──────────────────────────────────────────────────
//
// DESIGN PRINCIPLE — Memory Portability
//
// The brain (memory + distillation) is completely decoupled from the LLM.
// Any provider that implements LLMProvider receives the EXACT SAME distilled
// context string — proving that cognitive memory is portable across providers.
//
// "Any provider that implements this interface can consume the same distilled context."
//
// To wire this to a real LLM (e.g. OpenAI), replace a provider's `call()` body
// with a fetch() to the provider's API. The context injection logic is unchanged.
// ──────────────────────────────────────────────────────────────────────────────

export interface LLMProvider {
    name: string;
    call(context: string, prompt: string): Promise<string>;
}

/**
 * buildSystemPrompt — injects distilled memory context into the LLM system role.
 *
 * This is the crucial handoff: the LLM is STATELESS, but receives the user's
 * memory as structured context — making it appear personalized without storing
 * data on the LLM side.
 */
function buildSystemPrompt(context: string): string {
    return [
        'You are a helpful AI assistant.',
        'Before answering, carefully read the user\'s personal memory context below.',
        'Use that context to personalize your response.',
        '',
        context,
        '',
        'Now answer the user\'s question using this context.',
    ].join('\n');
}

// ─── Simulated Provider A ──────────────────────────────────────────────────────

export const ProviderA: LLMProvider = {
    name: 'SimulatedProvider-A (OpenAI-compatible interface)',

    async call(context: string, prompt: string): Promise<string> {
        const systemPrompt = buildSystemPrompt(context);

        // In production, replace this block with:
        //   const res = await fetch('https://api.openai.com/v1/chat/completions', { ... })
        // For this MVP: return a deterministic simulated response that reflects the context.
        const contextLines = context
            .split('\n')
            .filter((l) => l.startsWith('['))
            .map((l) => l.replace(/\[.*?\]\s*/, '• '))
            .join('\n');

        return [
            `[${this.name}]`,
            `Received prompt: "${prompt}"`,
            '',
            `Based on your personal memory context, here is what I know about you:`,
            contextLines || '  (no specific memories matched)',
            '',
            `My response: I've personalized this answer using your brain vault on DataHaven.`,
            `Your preferences and goals were retrieved, decrypted locally, and injected here.`,
        ].join('\n');
    },
};

// ─── Simulated Provider B ──────────────────────────────────────────────────────

export const ProviderB: LLMProvider = {
    name: 'SimulatedProvider-B (Anthropic-compatible interface)',

    async call(context: string, prompt: string): Promise<string> {
        const _systemPrompt = buildSystemPrompt(context); // same injection, different provider

        const contextLines = context
            .split('\n')
            .filter((l) => l.startsWith('['))
            .map((l) => l.replace(/\[.*?\]\s*/, '→ '))
            .join('\n');

        return [
            `[${this.name}]`,
            `Question received: "${prompt}"`,
            '',
            `Hello! I'm powered by a different inference engine, but I received the exact`,
            `same memory context from your DataHaven brain vault:`,
            contextLines || '  (no specific memories matched)',
            '',
            `This proves your memory is portable — same vault, same context, different provider.`,
        ].join('\n');
    },
};

// ─── Unified call helper ───────────────────────────────────────────────────────

/**
 * callWithContext — injects distilled context into the LLM prompt and logs the result.
 *
 * This function is the portability proof: the exact same context string flows
 * into both Provider A and Provider B without modification.
 */
export async function callWithContext(
    provider: LLMProvider,
    context: string,
    prompt: string,
): Promise<string> {
    console.log(`\n🤖 Calling ${provider.name}...`);
    const response = await provider.call(context, prompt);
    console.log('\n--- LLM Response ---');
    console.log(response);
    console.log('--- End Response ---\n');
    return response;
}
