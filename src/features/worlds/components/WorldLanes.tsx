'use client';

import { useState } from 'react';
import type { World } from '@/entities/world/types';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';
import { CreateRealityModal } from '@/features/worlds/components/CreateRealityModal';
import { WorldLane } from '@/features/worlds/components/WorldLane';
import type { useGenerationRunner } from '@/features/experiment/hooks/use-generation-runner';

export function WorldLanes({ worlds, runner }: { worlds: World[]; runner: ReturnType<typeof useGenerationRunner> }) {
  const bundle = useExperimentStore((state) => state.bundle);
  const activeWorldId = useExperimentStore((state) => state.activeWorldId);
  const scrubSequence = useExperimentStore((state) => state.scrubSequence);
  const branchWorld = useExperimentStore((state) => state.branchWorld);
  const [branchParent, setBranchParent] = useState<string>();
  if (!bundle) return null;
  return (
    <>
      <section className="grid gap-8 pb-32 md:grid-cols-2 xl:grid-cols-[repeat(var(--world-count),minmax(0,1fr))]" style={{ ['--world-count' as string]: Math.min(worlds.length, 4) }}>
        {worlds.map((world, index) => (
          <WorldLane key={world.id} world={world} bundle={bundle} index={index} active={activeWorldId === world.id} scrubSequence={scrubSequence} onRun={() => void runner.runWorld(world)} onStop={() => runner.stopWorld(world.id)} onBranch={() => setBranchParent(world.id)} />
        ))}
      </section>
      {branchParent ? <CreateRealityModal onClose={() => setBranchParent(undefined)} onCreate={(preset) => { branchWorld(branchParent, preset); setBranchParent(undefined); }} /> : null}
    </>
  );
}
