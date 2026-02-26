/**
 * MemoryType — semantic category for distiller tag-matching
 *
 * preference  — things the user likes/dislikes
 * goal        — things the user is working toward
 * fact        — facts the user stated as true
 */
export type MemoryType = 'preference' | 'goal' | 'fact';

/**
 * MemoryEvent — the canonical data model for a single brain memory.
 *
 * Field justifications:
 *   id        — UUID-based unique identity; enables deduplication & lookup by fileKey
 *   type      — drives distiller scoring (tag expansion per type)
 *   content   — the actual memory text stored encrypted on DataHaven
 *   tags      — keyword index; distiller scores memories by tag overlap with the prompt
 *   createdAt — ISO timestamp; supports ordering, audit trail, and TTL policies
 *   source    — provenance ("user-input", "llm-inferred") for trust scoring
 */
export interface MemoryEvent {
    id: string;
    type: MemoryType;
    content: string;
    tags: string[];
    createdAt: string;
    source: string;
}

/**
 * StoredMemoryRef — returned after a memory is written to DataHaven.
 * Lets the caller look up any memory by its on-chain fileKey.
 */
export interface StoredMemoryRef {
    memoryId: string;
    fileKey: string;       // hex H256 — used to retrieve the file from MSP
    fingerprint: string;   // hex — Merkle leaf commitment to the encrypted content
    bucketId: string;
    storedAt: string;      // ISO timestamp
}
