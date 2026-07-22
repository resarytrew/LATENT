import { beforeEach, describe, expect, it } from 'vitest';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';

beforeEach(() => useExperimentStore.setState({ bundle: undefined, activeWorldId: undefined, inspectorWorldId: undefined, compareOpen: false, commandOpen: false, savedOpen: false, selectedEventId: undefined, scrubSequence: undefined, isTimelinePlaying: false, notice: undefined }));

it('branches world and records parent link', () => {
  const bundle = useExperimentStore.getState().createExperiment('Design a city without cars.', 'mock');
  const childId = useExperimentStore.getState().branchWorld(bundle.experiment.rootWorldId, 'temperature');
  const state = useExperimentStore.getState();
  expect(childId).toBeTruthy();
  expect(state.bundle?.worlds[childId!].parentWorldId).toBe(bundle.experiment.rootWorldId);
  expect(state.bundle?.experiment.worldIds).toHaveLength(2);
});

it('branches from timeline event honestly', () => {
  const bundle = useExperimentStore.getState().createExperiment('Prompt', 'mock');
  const eventId = Object.values(bundle.events)[0].id;
  useExperimentStore.getState().selectEvent(eventId);
  const childId = useExperimentStore.getState().branchFromSelectedEvent();
  expect(useExperimentStore.getState().bundle?.worlds[childId!].branchPointEventId).toBe(eventId);
});
