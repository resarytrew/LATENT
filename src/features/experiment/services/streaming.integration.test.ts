import { beforeEach, describe, expect, it } from 'vitest';
import { MockProvider } from '@/features/providers/adapters/mock-provider';
import { DEFAULT_MODEL_CONFIG, DEFAULT_SYSTEM_PROMPT } from '@/shared/config/model-defaults';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';

beforeEach(() => useExperimentStore.setState({ bundle: undefined, activeWorldId: undefined, inspectorWorldId: undefined, compareOpen: false, commandOpen: false, savedOpen: false, selectedEventId: undefined, scrubSequence: undefined, isTimelinePlaying: false, notice: undefined }));

it('streams one world through the provider abstraction', async () => {
  const provider = new MockProvider();
  const chunks: string[] = [];
  for await (const event of provider.stream({ worldId: 'w', prompt: 'Design a city without cars.', systemPrompt: DEFAULT_SYSTEM_PROMPT, modelConfig: DEFAULT_MODEL_CONFIG })) {
    if (event.text) chunks.push(event.text);
  }
  expect(chunks.join('')).toContain('city');
});

it('supports abort without fabricating continuation', async () => {
  const provider = new MockProvider();
  const controller = new AbortController();
  const seen: string[] = [];
  for await (const event of provider.stream({ worldId: 'w', prompt: 'Should AI make medical decisions?', systemPrompt: DEFAULT_SYSTEM_PROMPT, modelConfig: DEFAULT_MODEL_CONFIG, abortSignal: controller.signal })) {
    if (event.text) {
      seen.push(event.text);
      controller.abort();
    }
    if (event.finishReason === 'aborted') break;
  }
  expect(seen.length).toBe(1);
});

it('records parallel completion and partial failure independently', () => {
  const bundle = useExperimentStore.getState().createExperiment('Explain why the sky is blue.', 'mock');
  const childId = useExperimentStore.getState().branchWorld(bundle.experiment.rootWorldId, 'temperature')!;
  useExperimentStore.getState().startGeneration(bundle.experiment.rootWorldId);
  useExperimentStore.getState().startGeneration(childId);
  useExperimentStore.getState().appendGenerationChunk(bundle.experiment.rootWorldId, { index: 0, text: 'ok', source: 'simulated' });
  useExperimentStore.getState().completeGeneration(bundle.experiment.rootWorldId, { finishReason: 'stop', latency: 10 });
  useExperimentStore.getState().failGeneration(childId, 'Injected provider failure');
  const state = useExperimentStore.getState();
  expect(state.bundle?.worlds[bundle.experiment.rootWorldId].status).toBe('completed');
  expect(state.bundle?.worlds[childId].status).toBe('failed');
  expect(state.bundle?.experiment.status).toBe('partial-failure');
});
