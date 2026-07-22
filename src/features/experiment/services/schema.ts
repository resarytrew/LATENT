import { z } from 'zod';
import { SCHEMA_VERSION } from '@/features/experiment/model/types';

const usageSchema = z.object({
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  source: z.enum(['real', 'simulated', 'unavailable'])
});

const modelConfigSchema = z.object({
  provider: z.enum(['mock', 'openai-compatible']),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  topP: z.number().min(0).max(1),
  maxOutputTokens: z.number().int().min(1).max(8192),
  seed: z.number().int().optional(),
  frequencyPenalty: z.number().min(-2).max(2),
  presencePenalty: z.number().min(-2).max(2)
});

const experimentSchema = z.object({
  id: z.string(),
  title: z.string(),
  question: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  rootWorldId: z.string(),
  worldIds: z.array(z.string()),
  selectedWorldIds: z.array(z.string()),
  status: z.enum(['draft', 'running', 'completed', 'partial-failure', 'saved']),
  version: z.number()
});

const worldSchema = z.object({
  id: z.string(),
  experimentId: z.string(),
  parentWorldId: z.string().optional(),
  branchPointEventId: z.string().optional(),
  name: z.string(),
  accent: z.enum(['solid', 'dash', 'dot', 'double']),
  prompt: z.string(),
  systemPrompt: z.string(),
  modelConfig: modelConfigSchema,
  status: z.enum(['draft', 'ready', 'streaming', 'completed', 'failed', 'aborted']),
  generationId: z.string().optional(),
  createdAt: z.string()
});

const generationChunkSchema = z.object({
  id: z.string(),
  generationId: z.string(),
  index: z.number(),
  text: z.string(),
  timestamp: z.string(),
  tokenIndex: z.number().optional(),
  source: z.enum(['real', 'simulated'])
});

const generationSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  status: z.enum(['idle', 'streaming', 'completed', 'failed', 'aborted']),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  text: z.string(),
  chunks: z.array(generationChunkSchema),
  usage: usageSchema.optional(),
  latency: z.number().optional(),
  finishReason: z.enum(['stop', 'length', 'content_filter', 'tool_calls', 'error', 'aborted', 'unknown']).optional(),
  error: z.string().optional()
});

const eventSchema = z.object({
  id: z.string(),
  worldId: z.string(),
  type: z.enum(['world.created', 'world.branched', 'generation.started', 'generation.chunk', 'generation.completed', 'generation.failed', 'parameter.changed', 'divergence.detected', 'playback.paused', 'branch.created']),
  timestamp: z.string(),
  payload: z.record(z.unknown()),
  sequence: z.number()
});

const pairwiseSchema = z.object({
  a: z.string(),
  b: z.string(),
  normalizedEditDistance: z.number(),
  lexicalOverlap: z.number(),
  bigramOverlap: z.number()
});

const divergenceReportSchema = z.object({
  experimentId: z.string(),
  worldIds: z.array(z.string()),
  commonPrefix: z.string(),
  divergenceCharacterIndex: z.number(),
  divergenceWordIndex: z.number(),
  pairwiseSimilarity: z.array(pairwiseSchema),
  normalizedEditDistance: z.record(z.record(z.number())),
  lexicalOverlap: z.record(z.record(z.number())),
  responseLengths: z.record(z.number()),
  mostSimilarPair: pairwiseSchema.optional(),
  mostDifferentPair: pairwiseSchema.optional(),
  warnings: z.array(z.string()),
  calculatedAt: z.string()
});

export const experimentBundleSchema = z.object({
  experiment: experimentSchema,
  worlds: z.record(worldSchema),
  generations: z.record(generationSchema),
  events: z.record(eventSchema),
  divergenceReport: divergenceReportSchema.optional(),
  settings: z.object({ theme: z.enum(['light', 'dark']), providerPreference: z.enum(['mock', 'openai-compatible']) }),
  schemaVersion: z.number()
});

export function parseExperimentBundle(value: unknown) {
  const parsed = experimentBundleSchema.parse(value);
  if (parsed.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`Unsupported experiment schema version ${parsed.schemaVersion}.`);
  }
  return parsed;
}
