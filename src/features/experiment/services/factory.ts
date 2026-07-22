import type { Experiment } from '@/entities/experiment/types';
import type { TimelineEvent } from '@/entities/event/types';
import type { World } from '@/entities/world/types';
import type { ExperimentBundle } from '@/features/experiment/model/types';
import { SCHEMA_VERSION } from '@/features/experiment/model/types';
import { DEFAULT_MODEL_CONFIG, DEFAULT_SYSTEM_PROMPT, WORLD_ACCENTS } from '@/shared/config/model-defaults';
import { createId, nowIso } from '@/shared/lib/id';

export function createTimelineEvent(worldId: string, type: TimelineEvent['type'], sequence: number, payload: TimelineEvent['payload'] = {}): TimelineEvent {
  return { id: createId('evt'), worldId, type, timestamp: nowIso(), payload, sequence };
}

export function createExperimentBundle(question: string, providerPreference: 'mock' | 'openai-compatible' = 'mock'): ExperimentBundle {
  const experimentId = createId('exp');
  const worldId = createId('world');
  const createdAt = nowIso();
  const world: World = {
    id: worldId,
    experimentId,
    name: 'World A',
    accent: 'solid',
    prompt: question,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    modelConfig: { ...DEFAULT_MODEL_CONFIG, provider: providerPreference, model: providerPreference === 'mock' ? 'latent-mock-reasoner' : 'gpt-4o-mini' },
    status: 'ready',
    createdAt
  };
  const experiment: Experiment = {
    id: experimentId,
    title: titleFromQuestion(question),
    question,
    createdAt,
    updatedAt: createdAt,
    rootWorldId: worldId,
    worldIds: [worldId],
    selectedWorldIds: [worldId],
    status: 'draft',
    version: SCHEMA_VERSION
  };
  const event = createTimelineEvent(worldId, 'world.created', 1, { name: world.name });
  return {
    experiment,
    worlds: { [worldId]: world },
    generations: {},
    events: { [event.id]: event },
    settings: { theme: 'light', providerPreference },
    schemaVersion: SCHEMA_VERSION
  };
}

export function titleFromQuestion(question: string): string {
  const cleaned = question.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= 48) return cleaned || 'Untitled experiment';
  return `${cleaned.slice(0, 45)}…`;
}

export function nextWorldName(index: number): string {
  return `World ${String.fromCharCode(65 + index)}`;
}

export function accentForIndex(index: number): World['accent'] {
  return WORLD_ACCENTS[index % WORLD_ACCENTS.length];
}
