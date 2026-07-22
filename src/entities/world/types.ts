import type { ProviderId } from '@/entities/generation/types';

export type WorldStatus = 'draft' | 'ready' | 'streaming' | 'completed' | 'failed' | 'aborted';

export type ModelConfigKey =
  | 'provider'
  | 'model'
  | 'temperature'
  | 'topP'
  | 'maxOutputTokens'
  | 'seed'
  | 'frequencyPenalty'
  | 'presencePenalty';

export interface ModelConfig {
  provider: ProviderId;
  model: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  seed?: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface World {
  id: string;
  experimentId: string;
  parentWorldId?: string;
  branchPointEventId?: string;
  name: string;
  accent: 'solid' | 'dash' | 'dot' | 'double';
  prompt: string;
  systemPrompt: string;
  modelConfig: ModelConfig;
  status: WorldStatus;
  generationId?: string;
  createdAt: string;
}
