import type { Experiment } from '@/entities/experiment/types';
import type { World } from '@/entities/world/types';
import type { Generation } from '@/entities/generation/types';
import type { TimelineEvent } from '@/entities/event/types';
import type { DivergenceReport } from '@/features/divergence/model/types';

export const SCHEMA_VERSION = 1;

export interface ExperimentBundle {
  experiment: Experiment;
  worlds: Record<string, World>;
  generations: Record<string, Generation>;
  events: Record<string, TimelineEvent>;
  divergenceReport?: DivergenceReport;
  settings: {
    theme: 'light' | 'dark';
    providerPreference: 'mock' | 'openai-compatible';
  };
  schemaVersion: number;
}
