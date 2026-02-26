/**
 * distiller.test.ts — Unit tests for the context distillation algorithm.
 *
 * All tests run offline — no network access required.
 * Tests verify that the distiller selects relevant memories deterministically.
 *
 * Run: npm test
 */

import 'dotenv/config';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { distillContext } from '../memory/distiller.js';
import { createMemoryEvent } from '../memory/memoryEvents.js';
import type { MemoryEvent } from '../memory/memoryTypes.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const darkModePreference = createMemoryEvent(
    'preference',
    'I always use dark mode in every application',
    ['dark-mode', 'ui', 'visual', 'preference'],
    'user-input',
);

const hackathonGoal = createMemoryEvent(
    'goal',
    'My goal is to win the DataHaven hackathon',
    ['hackathon', 'datahaven', 'win', 'goal'],
    'user-input',
);

const typescriptFact = createMemoryEvent(
    'fact',
    'I use TypeScript as my primary programming language',
    ['typescript', 'programming', 'language', 'code'],
    'user-input',
);

const allMemories: MemoryEvent[] = [darkModePreference, hackathonGoal, typescriptFact];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('distillContext — relevance selection', () => {
    test('selects the hackathon memory for a hackathon prompt', () => {
        const result = distillContext(
            'How should I prepare for the hackathon?',
            allMemories,
            1,
        );
        assert.equal(result.selectedCount, 1, 'Must select exactly 1 memory');
        assert.equal(
            result.selected[0].id,
            hackathonGoal.id,
            'Must select the hackathon goal memory',
        );
    });

    test('selects the TypeScript memory for a coding prompt', () => {
        const result = distillContext(
            'What programming language should I use for this code?',
            allMemories,
            1,
        );
        assert.equal(result.selected[0].id, typescriptFact.id, 'Must select typescript fact');
    });

    test('selects the dark mode memory for a UI prompt', () => {
        const result = distillContext(
            'What UI preference should I set for my applications?',
            allMemories,
            1,
        );
        assert.equal(result.selected[0].id, darkModePreference.id, 'Must select dark-mode preference');
    });

    test('returns at most topN memories', () => {
        const result = distillContext('Tell me everything', allMemories, 2);
        assert.ok(result.selectedCount <= 2, 'Must not exceed topN');
        assert.ok(result.selected.length <= 2);
    });

    test("returns all memories when topN >= total memories", () => {
        const result = distillContext('Tell me everything', allMemories, 10);
        assert.equal(result.selectedCount, allMemories.length);
    });
});

describe('distillContext — empty and edge cases', () => {
    test('returns empty context for empty memory array', () => {
        const result = distillContext('Any prompt', [], 3);
        assert.equal(result.selectedCount, 0);
        assert.equal(result.selected.length, 0);
        assert.ok(result.context.includes('no memories'), 'Context should indicate empty state');
    });

    test('output context string length is within character budget', () => {
        const result = distillContext('hackathon datahaven typescript', allMemories, 3);
        assert.ok(
            result.context.length <= 2100, // MAX_CONTEXT_CHARS + small margin
            `Context length ${result.context.length} exceeds budget`,
        );
    });

    test('context string contains expected memory markers', () => {
        const result = distillContext('hackathon', allMemories, 3);
        assert.ok(
            result.context.includes('=== USER MEMORY CONTEXT'),
            'Context must include header marker',
        );
        assert.ok(
            result.context.includes('=== END MEMORY CONTEXT'),
            'Context must include footer marker',
        );
    });

    test('context string includes memory type labels', () => {
        const result = distillContext('hackathon goal', allMemories, 3);
        // Should include at least one type label
        const hasTypeLabel = result.context.includes('[GOAL]') ||
            result.context.includes('[PREFERENCE]') ||
            result.context.includes('[FACT]');
        assert.ok(hasTypeLabel, 'Context must include type labels like [GOAL], [PREFERENCE], [FACT]');
    });

    test('totalMemories reflects the input array size', () => {
        const result = distillContext('test', allMemories, 3);
        assert.equal(result.totalMemories, allMemories.length);
    });

    test('always returns the original prompt unchanged', () => {
        const prompt = 'This is my unique question 12345';
        const result = distillContext(prompt, allMemories, 3);
        assert.equal(result.prompt, prompt, 'prompt field must be unchanged');
    });
});

describe('distillContext — no-overlap fallback', () => {
    test('returns topN memories even when no tags match (recency fallback)', () => {
        const result = distillContext(
            'zzzzqqqq unrelated words xyz',
            allMemories,
            2,
        );
        // No tags match, but we should still get 2 memories (score=0 fallback)
        assert.equal(result.selectedCount, 2, 'Must still return topN on no-match');
    });
});
