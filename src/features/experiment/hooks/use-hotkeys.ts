'use client';

import { useEffect } from 'react';
import { selectWorlds, useExperimentStore } from '@/features/experiment/store/experiment-store';
import type { useGenerationRunner } from '@/features/experiment/hooks/use-generation-runner';

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return Boolean(el?.closest('input, textarea, select, [contenteditable="true"]'));
}

export function useHotkeys(runner: ReturnType<typeof useGenerationRunner>) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        useExperimentStore.getState().setCommandOpen(true);
        return;
      }
      if (mod && event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        runner.runAll();
        return;
      }
      if (mod && event.key === 'Enter') {
        event.preventDefault();
        runner.runActive();
        return;
      }
      if (mod && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        const state = useExperimentStore.getState();
        if (state.activeWorldId) state.branchWorld(state.activeWorldId, 'duplicate');
        return;
      }
      if (event.key === 'Escape') {
        useExperimentStore.setState({ inspectorWorldId: undefined, commandOpen: false, savedOpen: false, compareOpen: false });
        return;
      }
      if (!isEditable(event.target) && event.key === ' ') {
        event.preventDefault();
        useExperimentStore.getState().toggleTimelinePlayback();
      }
      if (!isEditable(event.target) && /^[1-4]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        const world = selectWorlds(useExperimentStore.getState().bundle)[index];
        if (world) useExperimentStore.getState().selectWorld(world.id);
      }
      if (!isEditable(event.target) && event.key.toLowerCase() === 'c') {
        useExperimentStore.getState().toggleCompare(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runner]);
}
