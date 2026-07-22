'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { CompareView } from '@/features/divergence/components/CompareView';
import { useDivergenceWorker } from '@/features/divergence/hooks';
import { CommandPalette } from '@/features/experiment/components/CommandPalette';
import { Inspector } from '@/features/experiment/components/Inspector';
import { SavedExperiments } from '@/features/experiment/components/SavedExperiments';
import { TopBar } from '@/features/experiment/components/TopBar';
import { useAutosave } from '@/features/experiment/hooks/use-autosave';
import { useGenerationRunner } from '@/features/experiment/hooks/use-generation-runner';
import { useHotkeys } from '@/features/experiment/hooks/use-hotkeys';
import { loadExperiment } from '@/features/experiment/services/persistence';
import { selectWorlds, useExperimentStore } from '@/features/experiment/store/experiment-store';
import { GlobalTimeline } from '@/features/timeline/components/GlobalTimeline';
import { WorldLanes } from '@/features/worlds/components/WorldLanes';
import { Button } from '@/shared/ui/button';

export function Workspace({ experimentId }: { experimentId: string }) {
  const router = useRouter();
  const bundle = useExperimentStore((state) => state.bundle);
  const setBundle = useExperimentStore((state) => state.setBundle);
  const compareOpen = useExperimentStore((state) => state.compareOpen);
  const savedOpen = useExperimentStore((state) => state.savedOpen);
  const setSavedOpen = useExperimentStore((state) => state.setSavedOpen);
  const notice = useExperimentStore((state) => state.notice);
  const clearNotice = useExperimentStore((state) => state.clearNotice);
  const setDivergenceReport = useExperimentStore((state) => state.setDivergenceReport);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const runner = useGenerationRunner();
  useHotkeys(runner);
  useAutosave(bundle);
  const autoRunRef = useRef(false);

  useEffect(() => {
    let active = true;
    loadExperiment(experimentId)
      .then((loaded) => {
        if (!active) return;
        if (loaded) setBundle(loaded);
        else setLoadError('Experiment not found in local storage. Open a saved experiment or start a new one.');
      })
      .catch(() => setLoadError('Could not open IndexedDB. Local persistence may be unavailable.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [experimentId, setBundle]);

  useEffect(() => {
    if (bundle?.settings.theme) document.documentElement.dataset.theme = bundle.settings.theme;
  }, [bundle?.settings.theme]);

  const onReport = useCallback((report: Parameters<typeof setDivergenceReport>[0]) => setDivergenceReport(report), [setDivergenceReport]);
  const calculateDivergence = useDivergenceWorker(onReport);
  const completedSignature = useMemo(() => {
    if (!bundle) return '';
    return selectWorlds(bundle)
      .map((world) => {
        const generation = world.generationId ? bundle.generations[world.generationId] : undefined;
        return generation?.status === 'completed' ? `${world.id}:${generation.text.length}:${generation.text.slice(-24)}` : '';
      })
      .join('|');
  }, [bundle]);

  useEffect(() => {
    const stateBundle = useExperimentStore.getState().bundle;
    if (!stateBundle || !completedSignature) return;
    const responses = selectWorlds(stateBundle)
      .map((world) => ({ worldId: world.id, text: world.generationId ? stateBundle.generations[world.generationId]?.text ?? '' : '' }))
      .filter((response) => response.text.trim().length > 0);
    if (responses.length >= 2 && responses.every((response) => stateBundle.generations[stateBundle.worlds[response.worldId].generationId ?? '']?.status === 'completed')) {
      calculateDivergence({ experimentId: stateBundle.experiment.id, responses });
    }
  }, [completedSignature, calculateDivergence]);

  useEffect(() => {
    if (!bundle || autoRunRef.current) return;
    const root = bundle.worlds[bundle.experiment.rootWorldId];
    if (root && !root.generationId) {
      autoRunRef.current = true;
      void runner.runWorld(root);
    }
  }, [bundle, runner]);

  if (loading) return <main className="flex min-h-screen items-center justify-center font-mono text-sm text-secondary">Opening local experiment…</main>;
  if (loadError || !bundle) {
    return <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"><p className="text-secondary">{loadError}</p><Button variant="primary" onClick={() => router.push('/')}>Return to entry</Button></main>;
  }

  const worlds = selectWorlds(bundle);

  return (
    <main className="min-h-screen">
      <TopBar onRunAll={runner.runAll} onStopAll={runner.stopAll} />
      <div className="mx-auto max-w-[1800px] px-4 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">Model Divergence</p>
            <h2 className="mt-2 max-w-4xl text-3xl font-normal tracking-[-0.04em] md:text-5xl">{bundle.experiment.question}</h2>
          </div>
          {worlds.length < 4 ? <Button variant="secondary" onClick={() => useExperimentStore.getState().branchWorld(useExperimentStore.getState().activeWorldId ?? bundle.experiment.rootWorldId, 'temperature')}>Create another reality</Button> : null}
        </div>
        {notice ? <div className="mb-5 flex items-center justify-between border border-hairline p-3 text-sm text-secondary"><span>{notice}</span><button onClick={clearNotice} className="text-primary">Dismiss</button></div> : null}
        <WorldLanes worlds={worlds} runner={runner} />
      </div>
      <GlobalTimeline />
      <Inspector />
      <CommandPalette runner={runner} />
      <AnimatePresence>{compareOpen ? <CompareView /> : null}</AnimatePresence>
      {savedOpen ? <SavedExperiments onClose={() => setSavedOpen(false)} /> : null}
    </main>
  );
}
