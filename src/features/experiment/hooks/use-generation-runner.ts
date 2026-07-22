'use client';

import { useCallback, useRef } from 'react';
import type { World } from '@/entities/world/types';
import { streamGeneration } from '@/features/providers/model/client-stream';
import { selectWorlds, useExperimentStore } from '@/features/experiment/store/experiment-store';

export function useGenerationRunner() {
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  const runWorld = useCallback(async (world: World) => {
    const store = useExperimentStore.getState();
    controllersRef.current.get(world.id)?.abort();
    const controller = new AbortController();
    controllersRef.current.set(world.id, controller);
    store.startGeneration(world.id);
    let finalLatency: number | undefined;
    let completed = false;
    try {
      for await (const event of streamGeneration({ worldId: world.id, prompt: world.prompt, systemPrompt: world.systemPrompt, modelConfig: world.modelConfig, abortSignal: controller.signal })) {
        if (event.type === 'provider' && event.providerId !== world.modelConfig.provider) {
          useExperimentStore.setState({ notice: `Provider ${world.modelConfig.provider} is unavailable; streaming with ${event.providerId}.` });
        }
        if (event.type === 'chunk') {
          useExperimentStore.getState().appendGenerationChunk(world.id, event);
        }
        if (event.type === 'meta') {
          finalLatency = event.latency ?? finalLatency;
          if (event.usage || event.finishReason) {
            useExperimentStore.getState().completeGeneration(world.id, { usage: event.usage, latency: finalLatency, finishReason: event.finishReason });
            completed = true;
          }
        }
        if (event.type === 'warning') {
          useExperimentStore.setState({ notice: event.message });
        }
        if (event.type === 'error') {
          useExperimentStore.getState().failGeneration(world.id, event.message);
          completed = true;
        }
        if (event.type === 'done' && !completed) {
          useExperimentStore.getState().completeGeneration(world.id, { latency: event.latency ?? finalLatency, finishReason: 'stop' });
          completed = true;
        }
      }
      if (!completed && controller.signal.aborted) {
        useExperimentStore.getState().failGeneration(world.id, 'Generation aborted by user.', true);
      }
    } catch (error) {
      useExperimentStore.getState().failGeneration(world.id, controller.signal.aborted ? 'Generation aborted by user.' : error instanceof Error ? error.message : 'Stream failed.', controller.signal.aborted);
    } finally {
      controllersRef.current.delete(world.id);
    }
  }, []);

  const runActive = useCallback(() => {
    const state = useExperimentStore.getState();
    const active = state.activeWorldId && state.bundle?.worlds[state.activeWorldId];
    if (active) void runWorld(active);
  }, [runWorld]);

  const runAll = useCallback(() => {
    const state = useExperimentStore.getState();
    selectWorlds(state.bundle).forEach((world) => void runWorld(world));
  }, [runWorld]);

  const stopWorld = useCallback((worldId: string) => {
    controllersRef.current.get(worldId)?.abort();
  }, []);

  const stopAll = useCallback(() => {
    controllersRef.current.forEach((controller) => controller.abort());
  }, []);

  return { runWorld, runActive, runAll, stopWorld, stopAll };
}
