export type ProviderId = 'mock' | 'openai-compatible';
export type GenerationStatus = 'idle' | 'streaming' | 'completed' | 'failed' | 'aborted';
export type GenerationChunkSource = 'real' | 'simulated';

export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  source: 'real' | 'simulated' | 'unavailable';
}

export interface GenerationChunk {
  id: string;
  generationId: string;
  index: number;
  text: string;
  timestamp: string;
  tokenIndex?: number;
  source: GenerationChunkSource;
}

export interface Generation {
  id: string;
  worldId: string;
  status: GenerationStatus;
  startedAt: string;
  completedAt?: string;
  text: string;
  chunks: GenerationChunk[];
  usage?: Usage;
  latency?: number;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' | 'aborted' | 'unknown';
  error?: string;
}
