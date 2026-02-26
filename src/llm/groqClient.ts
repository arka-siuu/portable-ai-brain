import 'dotenv/config';
import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY missing from .env');
}

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Available providers ────────────────────────────────────────────────────────

export const PROVIDERS = [
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 (8B) — Fast' },
    { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
    { id: 'qwen/qwen3-32b', label: 'Qwen 3 (32B) — Large' },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]['id'];

// ─── Message format ─────────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// ─── Core chat function ─────────────────────────────────────────────────────────

/**
 * chatWithProvider — sends a conversation to the selected Groq model.
 *
 * @param model       — Groq model ID
 * @param messages    — full conversation history (user + assistant turns)
 * @param systemPrompt — optional system prompt (injects memory context when brain is ON)
 * @returns assistant reply string
 */
export async function chatWithProvider(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
): Promise<string> {
    const systemMessages: ChatMessage[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }]
        : [];

    const completion = await groq.chat.completions.create({
        model,
        messages: [...systemMessages, ...messages],
        temperature: 0.7,
        max_tokens: 512,
    });

    return completion.choices[0]?.message?.content ?? '(no response)';
}
