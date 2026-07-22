import type { DivergenceInput, DivergenceReport, PairwiseSimilarity } from '@/features/divergence/model/types';

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function tokenize(text: string): string[] {
  return normalizeText(text).match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? [];
}

export function commonPrefix(texts: string[]): string {
  if (texts.length === 0) return '';
  const normalized = texts.map(normalizeText);
  let index = 0;
  const shortest = Math.min(...normalized.map((text) => text.length));
  while (index < shortest && normalized.every((text) => text[index] === normalized[0][index])) index += 1;
  return normalized[0].slice(0, index);
}

export function levenshtein(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const previous = new Array(right.length + 1).fill(0).map((_, i) => i);
  const current = new Array(right.length + 1).fill(0);
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
  }
  return previous[right.length];
}

export function normalizedLevenshteinDistance(a: string, b: string): number {
  const max = Math.max(Array.from(a).length, Array.from(b).length);
  if (max === 0) return 0;
  return levenshtein(a, b) / max;
}

function wordSet(text: string): Set<string> {
  return new Set(tokenize(text).filter((token) => /[\p{L}\p{N}]/u.test(token)).map((token) => token.toLowerCase()));
}

export function jaccardSimilarity(a: string, b: string): number {
  const left = wordSet(a);
  const right = wordSet(b);
  if (left.size === 0 && right.size === 0) return 1;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function bigrams(text: string): Set<string> {
  const words = tokenize(text).filter((token) => /[\p{L}\p{N}]/u.test(token)).map((token) => token.toLowerCase());
  const set = new Set<string>();
  for (let i = 0; i < words.length - 1; i += 1) set.add(`${words[i]} ${words[i + 1]}`);
  return set;
}

export function bigramOverlap(a: string, b: string): number {
  const left = bigrams(a);
  const right = bigrams(b);
  if (left.size === 0 && right.size === 0) return 1;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function divergenceWordIndex(prefix: string): number {
  return tokenize(prefix).filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
}

export function calculateDivergenceReport(input: DivergenceInput): DivergenceReport {
  const responses = input.responses.map((response) => ({ ...response, text: normalizeText(response.text) }));
  const prefix = commonPrefix(responses.map((response) => response.text));
  const pairwiseSimilarity: PairwiseSimilarity[] = [];
  const normalizedEditDistance: Record<string, Record<string, number>> = {};
  const lexicalOverlap: Record<string, Record<string, number>> = {};
  const responseLengths: Record<string, number> = {};

  for (const response of responses) {
    responseLengths[response.worldId] = Array.from(response.text).length;
    normalizedEditDistance[response.worldId] = {};
    lexicalOverlap[response.worldId] = {};
  }

  for (let i = 0; i < responses.length; i += 1) {
    for (let j = i + 1; j < responses.length; j += 1) {
      const a = responses[i];
      const b = responses[j];
      const edit = normalizedLevenshteinDistance(a.text, b.text);
      const lexical = jaccardSimilarity(a.text, b.text);
      const bigram = bigramOverlap(a.text, b.text);
      normalizedEditDistance[a.worldId][b.worldId] = edit;
      normalizedEditDistance[b.worldId][a.worldId] = edit;
      lexicalOverlap[a.worldId][b.worldId] = lexical;
      lexicalOverlap[b.worldId][a.worldId] = lexical;
      pairwiseSimilarity.push({ a: a.worldId, b: b.worldId, normalizedEditDistance: edit, lexicalOverlap: lexical, bigramOverlap: bigram });
    }
  }

  const mostSimilarPair = [...pairwiseSimilarity].sort((a, b) => b.lexicalOverlap - a.lexicalOverlap || a.normalizedEditDistance - b.normalizedEditDistance)[0];
  const mostDifferentPair = [...pairwiseSimilarity].sort((a, b) => b.normalizedEditDistance - a.normalizedEditDistance || a.lexicalOverlap - b.lexicalOverlap)[0];
  const warnings: string[] = [];
  if (responses.some((response) => tokenize(response.text).length < 12)) warnings.push('Some responses are very short; divergence metrics may be weak text heuristics.');
  if (responses.length < 2) warnings.push('At least two worlds are required for meaningful divergence comparison.');

  return {
    experimentId: input.experimentId,
    worldIds: responses.map((response) => response.worldId),
    commonPrefix: prefix,
    divergenceCharacterIndex: prefix.length,
    divergenceWordIndex: divergenceWordIndex(prefix),
    pairwiseSimilarity,
    normalizedEditDistance,
    lexicalOverlap,
    responseLengths,
    mostSimilarPair,
    mostDifferentPair,
    warnings,
    calculatedAt: new Date().toISOString()
  };
}
