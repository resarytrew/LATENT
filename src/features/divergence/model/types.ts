export interface PairwiseSimilarity {
  a: string;
  b: string;
  normalizedEditDistance: number;
  lexicalOverlap: number;
  bigramOverlap: number;
}

export interface DivergenceReport {
  experimentId: string;
  worldIds: string[];
  commonPrefix: string;
  divergenceCharacterIndex: number;
  divergenceWordIndex: number;
  pairwiseSimilarity: PairwiseSimilarity[];
  normalizedEditDistance: Record<string, Record<string, number>>;
  lexicalOverlap: Record<string, Record<string, number>>;
  responseLengths: Record<string, number>;
  mostSimilarPair?: PairwiseSimilarity;
  mostDifferentPair?: PairwiseSimilarity;
  warnings: string[];
  calculatedAt: string;
}

export interface DivergenceInput {
  experimentId: string;
  responses: Array<{ worldId: string; text: string }>;
}
