import { describe, expect, it } from 'vitest';
import { createExperimentBundle } from '@/features/experiment/services/factory';

it('creates experiment and root world', () => {
  const bundle = createExperimentBundle('Explain why the sky is blue.', 'mock');
  expect(bundle.experiment.question).toContain('sky');
  expect(bundle.experiment.rootWorldId).toBeTruthy();
  expect(bundle.worlds[bundle.experiment.rootWorldId].name).toBe('World A');
  expect(Object.values(bundle.events)[0].type).toBe('world.created');
});
