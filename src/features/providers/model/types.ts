import type { ModelConfig, ModelConfigKey } from '@/entities/world/types';
import type { Usage } from '@/entities/generation/types';

export interface ModelDescriptor {
  id: string;
  label: string;
  provider: string;
  supportsSeed: boolean;
  contextWindow?: number;
}

export interface GenerationRequest {
  worldId: string;
  prompt: string;
  systemPrompt: string;
  modelConfig: ModelConfig;
  abortSignal?: AbortSignal;
}

export interface ProviderStreamChunk {
  text?: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' | 'aborted' | 'unknown';
  usage?: Usage;
  tokenIndex?: number;
  source: 'real' | 'simulated';
  warning?: string;
}

export interface ModelProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  supports(configKey: ModelConfigKey): boolean;
  stream(request: GenerationRequest): AsyncIterable<ProviderStreamChunk>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public code: 'missing_key' | 'rate_limit' | 'network' | 'invalid_stream' | 'unsupported_parameter' | 'aborted' | 'unknown',
    public status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
