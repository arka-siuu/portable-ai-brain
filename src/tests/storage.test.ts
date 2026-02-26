/**
 * storage.test.ts — Unit tests for AES-256-GCM encryption/decryption.
 *
 * These tests run ENTIRELY OFFLINE — no DataHaven network calls.
 * They prove the crypto layer is correct before any file hits the chain.
 *
 * Run: npm test
 */

import 'dotenv/config';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encryptMemory, decryptMemory } from '../crypto/encrypt.js';
import { createMemoryEvent } from '../memory/memoryEvents.js';
import type { MemoryEvent } from '../memory/memoryTypes.js';

const sampleEvent: MemoryEvent = createMemoryEvent(
    'preference',
    'I prefer concise answers without filler words.',
    ['concise', 'communication', 'preference'],
    'user-input',
);

describe('Encryption round-trip', () => {
    test('encrypted string is valid JSON', () => {
        const encrypted = encryptMemory(sampleEvent);
        assert.doesNotThrow(() => JSON.parse(encrypted), 'Encrypted output must be valid JSON');
    });

    test('encrypted payload has required fields', () => {
        const encrypted = encryptMemory(sampleEvent);
        const payload = JSON.parse(encrypted) as Record<string, unknown>;
        assert.ok(payload.iv, 'payload must have iv');
        assert.ok(payload.authTag, 'payload must have authTag');
        assert.ok(payload.ciphertext, 'payload must have ciphertext');
    });

    test('ciphertext is NOT readable as plain JSON', () => {
        const encrypted = encryptMemory(sampleEvent);
        const payload = JSON.parse(encrypted) as { ciphertext: string };
        const raw = Buffer.from(payload.ciphertext, 'base64').toString('utf8');
        // Should NOT be parseable as the original MemoryEvent
        let parsed: unknown = null;
        try { parsed = JSON.parse(raw); } catch { /* expected */ }
        if (parsed && typeof parsed === 'object') {
            const p = parsed as Record<string, unknown>;
            assert.notEqual(
                p['id'],
                sampleEvent.id,
                'Ciphertext should not contain the original id in readable form',
            );
        }
    });

    test('decrypt(encrypt(event)) returns original MemoryEvent', () => {
        const encrypted = encryptMemory(sampleEvent);
        const decrypted = decryptMemory(encrypted);

        assert.equal(decrypted.id, sampleEvent.id, 'id must survive round-trip');
        assert.equal(decrypted.type, sampleEvent.type, 'type must survive round-trip');
        assert.equal(decrypted.content, sampleEvent.content, 'content must survive round-trip');
        assert.deepEqual(decrypted.tags, sampleEvent.tags, 'tags must survive round-trip');
        assert.equal(decrypted.createdAt, sampleEvent.createdAt, 'createdAt must survive round-trip');
        assert.equal(decrypted.source, sampleEvent.source, 'source must survive round-trip');
    });

    test('two encryptions of the same event produce different ciphertext (fresh IV)', () => {
        const enc1 = JSON.parse(encryptMemory(sampleEvent)) as { iv: string; ciphertext: string };
        const enc2 = JSON.parse(encryptMemory(sampleEvent)) as { iv: string; ciphertext: string };
        assert.notEqual(enc1.iv, enc2.iv, 'Each encryption must use a fresh IV');
        assert.notEqual(enc1.ciphertext, enc2.ciphertext, 'Ciphertext must differ when IV differs');
    });

    test('tampering with ciphertext causes decryption to throw', () => {
        const encrypted = encryptMemory(sampleEvent);
        const payload = JSON.parse(encrypted) as {
            iv: string;
            authTag: string;
            ciphertext: string;
        };

        // Corrupt the ciphertext by flipping a byte
        const cBytes = Buffer.from(payload.ciphertext, 'base64');
        cBytes[0] ^= 0xff;
        payload.ciphertext = cBytes.toString('base64');

        const tampered = JSON.stringify(payload);
        assert.throws(
            () => decryptMemory(tampered),
            'Tampered ciphertext must fail GCM auth tag verification',
        );
    });

    test('wrong authTag causes decryption to throw', () => {
        const encrypted = encryptMemory(sampleEvent);
        const payload = JSON.parse(encrypted) as {
            iv: string;
            authTag: string;
            ciphertext: string;
        };

        // Corrupt the auth tag
        const tagBytes = Buffer.from(payload.authTag, 'base64');
        tagBytes[0] ^= 0xff;
        payload.authTag = tagBytes.toString('base64');

        const tampered = JSON.stringify(payload);
        assert.throws(
            () => decryptMemory(tampered),
            'Bad auth tag must fail GCM verification',
        );
    });

    test('multiple different events all round-trip correctly', () => {
        const events: MemoryEvent[] = [
            createMemoryEvent('preference', 'I like dark mode', ['dark-mode'], 'user-input'),
            createMemoryEvent('goal', 'Ship MVP by tonight', ['mvp', 'ship'], 'user-input'),
            createMemoryEvent('fact', 'TypeScript is my primary language', ['typescript'], 'user-input'),
        ];

        for (const event of events) {
            const decrypted = decryptMemory(encryptMemory(event));
            assert.equal(decrypted.id, event.id, `Round-trip failed for event ${event.id}`);
        }
    });
});
