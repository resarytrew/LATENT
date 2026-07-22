import { describe, expect, it } from 'vitest';
import { DEFAULT_MODEL_CONFIG } from '@/shared/config/model-defaults';
import { diffModelConfig } from '@/features/worlds/services/config-diff';

it('diffs model config exactly', () => {
  const diff = diffModelConfig(DEFAULT_MODEL_CONFIG, { ...DEFAULT_MODEL_CONFIG, temperature: 1, seed: 7 });
  expect(diff.map((item) => item.key)).toEqual(['temperature', 'seed']);
});
