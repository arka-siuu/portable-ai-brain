import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { MemoryEvent } from '../memory/memoryTypes.js';

// ─── Trust boundary ────────────────────────────────────────────────────────────
// Encryption key is ONLY held in the client process (loaded from .env).
// It is NEVER sent to DataHaven, the MSP, or any LLM provider.
// The MSP stores ciphertext only — it cannot read memory contents.
// ──────────────────────────────────────────────────────────────────────────────

if (!process.env.ENCRYPTION_KEY) {
    throw new Error(
        'ENCRYPTION_KEY missing from .env — cannot encrypt or decrypt memories',
    );
}

// Convert 64-char hex string to 32-byte Buffer for AES-256-GCM
const ENCRYPTION_KEY_BYTES = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
if (ENCRYPTION_KEY_BYTES.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * EncryptedPayload — the wire format written to disk and uploaded to DataHaven.
 *
 * All fields are base64-encoded so the payload is safe as a UTF-8 JSON string.
 * The MSP stores this opaque blob — it has no access to `key` or plaintext.
 */
export interface EncryptedPayload {
    iv: string;       // base64 — 12-byte random IV (new for every encryption)
    authTag: string;  // base64 — 16-byte GCM authentication tag (integrity proof)
    ciphertext: string; // base64 — AES-256-GCM encrypted MemoryEvent JSON
}

/**
 * encryptMemory — encrypts a MemoryEvent using AES-256-GCM.
 *
 * Returns a JSON string suitable for writing to disk and uploading.
 * A fresh random IV is used on every call, so identical memories
 * produce different ciphertexts — this prevents correlation attacks.
 */
export function encryptMemory(event: MemoryEvent): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY_BYTES, iv);

    const plaintext = JSON.stringify(event);
    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const payload: EncryptedPayload = {
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        ciphertext: encrypted.toString('base64'),
    };

    return JSON.stringify(payload);
}

/**
 * decryptMemory — decrypts a stored EncryptedPayload back to a MemoryEvent.
 *
 * GCM authentication tag verification happens automatically inside decipher.final().
 * If the ciphertext has been tampered with, this will throw — providing integrity.
 */
export function decryptMemory(encryptedJson: string): MemoryEvent {
    const payload: EncryptedPayload = JSON.parse(encryptedJson);

    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const ciphertext = Buffer.from(payload.ciphertext, 'base64');

    const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BYTES, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(), // throws if auth tag check fails
    ]);

    return JSON.parse(decrypted.toString('utf8')) as MemoryEvent;
}
