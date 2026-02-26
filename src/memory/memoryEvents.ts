import { randomUUID } from 'node:crypto';
import type { MemoryEvent, MemoryType } from './memoryTypes.js';

/**
 * createMemoryEvent — factory for MemoryEvent.
 *
 * id is generated via crypto.randomUUID() (Node built-in, no external deps).
 * createdAt is set to the current UTC time in ISO 8601 format.
 *
 * @param type    — semantic category for this memory
 * @param content — the plain-text memory (will be encrypted before upload)
 * @param tags    — keyword list used by the distiller for relevance scoring
 * @param source  — provenance label (e.g. "user-input")
 */
export function createMemoryEvent(
    type: MemoryType,
    content: string,
    tags: string[],
    source: string,
): MemoryEvent {
    if (!content.trim()) throw new Error('Memory content cannot be empty');
    if (!tags.length) throw new Error('Memory must have at least one tag');

    return {
        id: randomUUID(),
        type,
        content,
        tags,
        createdAt: new Date().toISOString(),
        source,
    };
}

/**
 * isValidMemoryEvent — schema guard used in tests and retrieval path.
 * Returns true only if all required fields are present and well-typed.
 */
export function isValidMemoryEvent(obj: unknown): obj is MemoryEvent {
    if (typeof obj !== 'object' || obj === null) return false;
    const m = obj as Record<string, unknown>;
    const validTypes = ['preference', 'goal', 'fact'];
    return (
        typeof m.id === 'string' &&
        validTypes.includes(m.type as string) &&
        typeof m.content === 'string' && m.content.length > 0 &&
        Array.isArray(m.tags) &&
        typeof m.createdAt === 'string' &&
        typeof m.source === 'string'
    );
}
