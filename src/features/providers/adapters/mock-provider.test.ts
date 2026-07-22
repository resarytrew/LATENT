import { describe, expect, it } from 'vitest';
import { MockProvider } from '@/features/providers/adapters/mock-provider';
import { DEFAULT_MODEL_CONFIG, DEFAULT_SYSTEM_PROMPT } from '@/shared/config/model-defaults';

async function collect(temp: number, systemPrompt = DEFAULT_SYSTEM_PROMPT) {
  const provider = new MockProvider();
  let text = '';
  for await (const chunk of provider.stream({ worldId: 'w', prompt: 'Explain why the sky is blue.', systemPrompt, modelConfig: { ...DEFAULT_MODEL_CONFIG, temperature: temp, seed: 11 } })) {
    text += chunk.text ?? '';
  }
  return text;
}

it('is deterministic for same seed and config', async () => {
  await expect(collect(0.5)).resolves.toBe(await collect(0.5));
});

it('changes output with temperature and system prompt', async () => {
  const low = await collect(0.1);
  const high = await collect(1.0, 'You are a skeptical reviewer.');
  expect(low).not.toBe(high);
  expect(high).toContain('skeptical');
});
