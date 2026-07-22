import type { GenerationRequest } from '@/features/providers/model/types';
import type { Usage } from '@/entities/generation/types';

export type ClientStreamEvent =
  | { type: 'provider'; providerId: string }
  | { type: 'chunk'; index: number; text: string; timestamp: string; tokenIndex?: number; source: 'real' | 'simulated' }
  | { type: 'meta'; usage?: Usage; finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'error' | 'aborted' | 'unknown'; latency?: number }
  | { type: 'warning'; message: string }
  | { type: 'done'; latency?: number }
  | { type: 'error'; message: string; code?: string; status?: number };

function parseEvent(raw: string): ClientStreamEvent | undefined {
  const lines = raw.split('\n');
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim();
  const data = lines.find((line) => line.startsWith('data:'))?.slice(5).trim();
  if (!event || !data) return undefined;
  const parsed = JSON.parse(data) as Record<string, unknown>;
  return { type: event, ...parsed } as ClientStreamEvent;
}

export async function* streamGeneration(request: GenerationRequest): AsyncIterable<ClientStreamEvent> {
  const response = await fetch('/api/generations/stream', {
    method: 'POST',
    signal: request.abortSignal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ worldId: request.worldId, prompt: request.prompt, systemPrompt: request.systemPrompt, modelConfig: request.modelConfig })
  });
  if (!response.ok || !response.body) {
    yield { type: 'error', message: `Stream failed with HTTP ${response.status}.`, status: response.status };
    return;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const event = parseEvent(part);
      if (event) yield event;
    }
  }
  if (buffer.trim()) {
    const event = parseEvent(buffer);
    if (event) yield event;
  }
}
