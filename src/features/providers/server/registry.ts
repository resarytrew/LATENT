import { MockProvider } from '@/features/providers/adapters/mock-provider';
import { OpenAICompatibleProvider } from '@/features/providers/adapters/openai-compatible-provider';
import type { ModelProvider } from '@/features/providers/model/types';

export function getServerProvider(requested?: string): ModelProvider {
  const hasExternalKey = Boolean(process.env.AI_API_KEY);
  const envProvider = process.env.AI_PROVIDER;
  if ((requested === 'openai-compatible' || envProvider === 'openai-compatible') && hasExternalKey) {
    return new OpenAICompatibleProvider({
      baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.AI_API_KEY || '',
      model: process.env.AI_MODEL || 'gpt-4o-mini'
    });
  }
  return new MockProvider();
}
