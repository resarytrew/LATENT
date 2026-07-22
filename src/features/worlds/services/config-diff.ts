import type { ModelConfig, ModelConfigKey, World } from '@/entities/world/types';

export interface ConfigDiffItem {
  key: 'prompt' | 'systemPrompt' | ModelConfigKey;
  parentValue: string | number | undefined;
  childValue: string | number | undefined;
}

const keys: ModelConfigKey[] = ['provider', 'model', 'temperature', 'topP', 'maxOutputTokens', 'seed', 'frequencyPenalty', 'presencePenalty'];

export function diffModelConfig(parent: ModelConfig, child: ModelConfig): ConfigDiffItem[] {
  return keys.flatMap((key) => (parent[key] !== child[key] ? [{ key, parentValue: parent[key], childValue: child[key] }] : []));
}

export function diffWorldFromParent(parent: World | undefined, child: World): ConfigDiffItem[] {
  if (!parent) return [];
  const diff = diffModelConfig(parent.modelConfig, child.modelConfig);
  if (parent.prompt !== child.prompt) diff.unshift({ key: 'prompt', parentValue: parent.prompt, childValue: child.prompt });
  if (parent.systemPrompt !== child.systemPrompt) diff.unshift({ key: 'systemPrompt', parentValue: parent.systemPrompt, childValue: child.systemPrompt });
  return diff;
}

export function formatConfigValue(value: string | number | undefined): string {
  if (value === undefined) return '—';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return value;
}
