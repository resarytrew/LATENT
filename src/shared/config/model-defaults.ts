import type { ModelConfig } from '@/entities/world/types';

export const DEFAULT_SYSTEM_PROMPT = 'You are precise, concise, and explicit about uncertainty.';

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'mock',
  model: 'latent-mock-reasoner',
  temperature: 0.5,
  topP: 0.9,
  maxOutputTokens: 420,
  seed: 42,
  frequencyPenalty: 0,
  presencePenalty: 0
};

export const WORLD_ACCENTS = ['solid', 'dash', 'dot', 'double'] as const;
