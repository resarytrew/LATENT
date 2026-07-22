import type { ModelConfigKey } from '@/entities/world/types';
import { ProviderError, type GenerationRequest, type ModelDescriptor, type ModelProvider, type ProviderStreamChunk } from '@/features/providers/model/types';

interface OpenAICompatibleOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function decodeSse(buffer: string): { events: string[]; rest: string } {
  const parts = buffer.split('\n\n');
  return { events: parts.slice(0, -1), rest: parts.at(-1) ?? '' };
}

export class OpenAICompatibleProvider implements ModelProvider {
  id = 'openai-compatible';

  constructor(private options: OpenAICompatibleOptions) {}

  async listModels(): Promise<ModelDescriptor[]> {
    return [{ id: this.options.model, label: this.options.model, provider: this.id, supportsSeed: false }];
  }

  supports(configKey: ModelConfigKey): boolean {
    return ['provider', 'model', 'temperature', 'topP', 'maxOutputTokens', 'frequencyPenalty', 'presencePenalty'].includes(configKey);
  }

  async *stream(request: GenerationRequest): AsyncIterable<ProviderStreamChunk> {
    if (!this.options.apiKey) {
      throw new ProviderError('AI_API_KEY is not configured. Switch to mock mode or set the server environment variable.', 'missing_key');
    }
    if (request.modelConfig.seed !== undefined) {
      yield { source: 'real', warning: 'Seed is not sent: this OpenAI-compatible adapter does not mark seed as supported.' };
    }

    const response = await fetch(`${this.options.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: request.abortSignal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: request.modelConfig.model || this.options.model,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.prompt }
        ],
        temperature: request.modelConfig.temperature,
        top_p: request.modelConfig.topP,
        max_tokens: request.modelConfig.maxOutputTokens,
        frequency_penalty: request.modelConfig.frequencyPenalty,
        presence_penalty: request.modelConfig.presencePenalty,
        stream: true,
        stream_options: { include_usage: true }
      })
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ProviderError('Generation aborted.', 'aborted');
      }
      throw new ProviderError('Provider network error.', 'network');
    });

    if (response.status === 429) {
      throw new ProviderError('Provider rate limit reached. Retry later or switch to mock.', 'rate_limit', 429);
    }
    if (!response.ok || !response.body) {
      throw new ProviderError(`Provider returned HTTP ${response.status}.`, response.status >= 500 ? 'network' : 'unknown', response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let rest = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const decoded = decoder.decode(value, { stream: true });
      const parsed = decodeSse(rest + decoded);
      rest = parsed.rest;
      for (const event of parsed.events) {
        const dataLines = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());
        for (const data of dataLines) {
          if (data === '[DONE]') return;
          try {
            const json = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string }; finish_reason?: string | null }>;
              usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
            };
            const choice = json.choices?.[0];
            if (choice?.delta?.content) yield { text: choice.delta.content, source: 'real' };
            if (json.usage) {
              yield {
                source: 'real',
                usage: {
                  promptTokens: json.usage.prompt_tokens,
                  completionTokens: json.usage.completion_tokens,
                  totalTokens: json.usage.total_tokens,
                  source: 'real'
                }
              };
            }
            if (choice?.finish_reason) yield { source: 'real', finishReason: choice.finish_reason as ProviderStreamChunk['finishReason'] };
          } catch {
            throw new ProviderError('Invalid stream chunk from provider.', 'invalid_stream');
          }
        }
      }
    }
  }
}
