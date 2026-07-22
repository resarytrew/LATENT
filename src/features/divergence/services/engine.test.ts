import { describe, expect, it } from 'vitest';
import { calculateDivergenceReport, jaccardSimilarity, normalizedLevenshteinDistance, tokenize } from '@/features/divergence/services/engine';

it('tokenizes words and punctuation', () => {
  expect(tokenize('Hello, world!')).toEqual(['Hello', ',', 'world', '!']);
});

it('normalizes levenshtein distance', () => {
  expect(normalizedLevenshteinDistance('abc', 'abc')).toBe(0);
  expect(normalizedLevenshteinDistance('abc', 'axc')).toBeCloseTo(1 / 3);
});

it('calculates jaccard similarity', () => {
  expect(jaccardSimilarity('red blue blue', 'blue green')).toBeCloseTo(1 / 3);
});

it('detects divergence report', () => {
  const report = calculateDivergenceReport({ experimentId: 'e', responses: [{ worldId: 'a', text: 'same prefix alpha' }, { worldId: 'b', text: 'same prefix beta' }] });
  expect(report.commonPrefix).toBe('same prefix ');
  expect(report.divergenceWordIndex).toBe(2);
  expect(report.pairwiseSimilarity).toHaveLength(1);
});
