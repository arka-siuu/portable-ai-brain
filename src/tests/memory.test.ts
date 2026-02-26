/**
 * memory.test.ts — Unit tests for MemoryEvent creation and schema validation.
 *
 * Run: npm test
 * Uses Node 22 built-in node:test — zero extra dependencies.
 */

import 'dotenv/config';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryEvent, isValidMemoryEvent } from '../memory/memoryEvents.js';
import type { MemoryEvent } from '../memory/memoryTypes.js';

// UUID v4 regex — validates randomUUID() output format
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('MemoryEvent creation', () => {
    test('produces all required fields', () => {
        const event = createMemoryEvent(
            'preference',
            'I prefer dark mode',
            ['dark-mode', 'ui', 'preference'],
            'user-input',
        );

        assert.ok(event.id, 'id must be present');
        assert.ok(event.type, 'type must be present');
        assert.ok(event.content, 'content must be present');
        assert.ok(Array.isArray(event.tags), 'tags must be an array');
        assert.ok(event.createdAt, 'createdAt must be present');
        assert.ok(event.source, 'source must be present');
    });

    test('id is a valid UUID v4', () => {
        const event = createMemoryEvent('goal', 'Ship the MVP', ['mvp', 'ship'], 'user-input');
        assert.match(event.id, UUID_REGEX, `id "${event.id}" is not a valid UUID v4`);
    });

    test('createdAt is a valid ISO 8601 timestamp', () => {
        const event = createMemoryEvent('fact', 'TypeScript is great', ['typescript'], 'user-input');
        const parsed = new Date(event.createdAt);
        assert.ok(!isNaN(parsed.getTime()), `createdAt "${event.createdAt}" is not a valid date`);
    });

    test('type is one of the valid MemoryTypes', () => {
        const validTypes = ['preference', 'goal', 'fact'] as const;
        for (const type of validTypes) {
            const event = createMemoryEvent(type, 'Test content', ['test'], 'user-input');
            assert.ok(
                validTypes.includes(event.type as (typeof validTypes)[number]),
                `type "${event.type}" is not valid`,
            );
        }
    });

    test('each event gets a unique id', () => {
        const e1 = createMemoryEvent('fact', 'Content A', ['a'], 'user-input');
        const e2 = createMemoryEvent('fact', 'Content B', ['b'], 'user-input');
        assert.notEqual(e1.id, e2.id, 'Two events should have different IDs');
    });

    test('throws if content is empty', () => {
        assert.throws(
            () => createMemoryEvent('fact', '   ', ['tag'], 'user-input'),
            /Memory content cannot be empty/,
        );
    });

    test('throws if tags array is empty', () => {
        assert.throws(
            () => createMemoryEvent('fact', 'Valid content', [], 'user-input'),
            /Memory must have at least one tag/,
        );
    });
});

describe('isValidMemoryEvent schema guard', () => {
    test('returns true for a valid event', () => {
        const event = createMemoryEvent(
            'goal',
            'Win the hackathon',
            ['hackathon', 'win'],
            'user-input',
        );
        assert.ok(isValidMemoryEvent(event));
    });

    test('returns false for null', () => {
        assert.ok(!isValidMemoryEvent(null));
    });

    test('returns false for missing type field', () => {
        const bad: Partial<MemoryEvent> = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            content: 'test',
            tags: ['t'],
            createdAt: new Date().toISOString(),
            source: 'user-input',
        };
        assert.ok(!isValidMemoryEvent(bad));
    });

    test('returns false for invalid type value', () => {
        const bad = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            type: 'opinion', // not valid
            content: 'test',
            tags: ['t'],
            createdAt: new Date().toISOString(),
            source: 'user-input',
        };
        assert.ok(!isValidMemoryEvent(bad));
    });
});
