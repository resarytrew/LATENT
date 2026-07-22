import { describe, expect, it, beforeEach } from 'vitest';
import { createExperimentBundle } from '@/features/experiment/services/factory';
import { exportExperimentJson, importExperimentJson, loadExperiment, resetPersistenceForTests, saveExperiment } from '@/features/experiment/services/persistence';

beforeEach(async () => resetPersistenceForTests());

it('serializes and validates imports', () => {
  const bundle = createExperimentBundle('Test prompt', 'mock');
  const imported = importExperimentJson(exportExperimentJson(bundle));
  expect(imported.experiment.id).toBe(bundle.experiment.id);
  expect(() => importExperimentJson('{"bad":true}')).toThrow();
});

it('saves and restores from IndexedDB', async () => {
  const bundle = createExperimentBundle('Restore me', 'mock');
  await saveExperiment(bundle);
  const restored = await loadExperiment(bundle.experiment.id);
  expect(restored?.experiment.question).toBe('Restore me');
});
