import type { ExperimentBundle } from '@/features/experiment/model/types';
import { SCHEMA_VERSION } from '@/features/experiment/model/types';

export function migrateExperimentBundle(bundle: ExperimentBundle): ExperimentBundle {
  if (bundle.schemaVersion === SCHEMA_VERSION) return bundle;
  return { ...bundle, schemaVersion: SCHEMA_VERSION, experiment: { ...bundle.experiment, version: SCHEMA_VERSION } };
}
