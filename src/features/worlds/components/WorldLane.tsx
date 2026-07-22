'use client';

import { motion } from 'framer-motion';
import type { World } from '@/entities/world/types';
import type { ExperimentBundle } from '@/features/experiment/model/types';
import { visibleTextForWorld, useExperimentStore } from '@/features/experiment/store/experiment-store';
import { diffWorldFromParent, formatConfigValue } from '@/features/worlds/services/config-diff';
import { Button } from '@/shared/ui/button';
import { cx } from '@/shared/lib/cx';

export function WorldLane({ world, bundle, index, active, scrubSequence, onRun, onStop, onBranch }: { world: World; bundle: ExperimentBundle; index: number; active: boolean; scrubSequence?: number; onRun: () => void; onStop: () => void; onBranch: () => void }) {
  const openInspector = useExperimentStore((state) => state.setInspectorWorld);
  const selectWorld = useExperimentStore((state) => state.selectWorld);
  const updateWorld = useExperimentStore((state) => state.updateWorld);
  const text = visibleTextForWorld(bundle, world.id, scrubSequence);
  const generation = world.generationId ? bundle.generations[world.generationId] : undefined;
  const parent = world.parentWorldId ? bundle.worlds[world.parentWorldId] : undefined;
  const diff = diffWorldFromParent(parent, world);
  const divergenceIndex = bundle.divergenceReport?.worldIds.includes(world.id) ? bundle.divergenceReport.divergenceCharacterIndex : undefined;
  const before = divergenceIndex !== undefined && text.length > divergenceIndex ? text.slice(0, divergenceIndex) : text;
  const after = divergenceIndex !== undefined && text.length > divergenceIndex ? text.slice(divergenceIndex) : '';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: active ? 1 : 0.78, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cx('flex min-h-[52vh] flex-col border-l border-hairline bg-transparent pl-4', active && 'border-l-signal')}
      aria-label={`${world.name} lane`}
      onClick={() => selectWorld(world.id)}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-secondary">0{index + 1}</p>
          <h2 className="mt-1 text-2xl font-normal tracking-[-0.04em]">{world.name}</h2>
          <p className="mt-2 min-h-5 font-mono text-xs text-secondary">
            {diff[0] ? `${diff[0].key}: ${formatConfigValue(diff[0].childValue)}` : world.parentWorldId ? 'duplicated' : 'root conditions'}
          </p>
        </div>
        <span className={cx('font-mono text-xs uppercase tracking-[0.16em]', world.status === 'failed' ? 'text-danger' : world.status === 'completed' ? 'text-success' : world.status === 'streaming' ? 'text-signal' : 'text-secondary')} aria-live="polite">
          {world.status}
        </span>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs text-secondary">
        <span>temp {world.modelConfig.temperature.toFixed(2)}</span>
        <span>topP {world.modelConfig.topP.toFixed(2)}</span>
        <span>seed {world.modelConfig.seed ?? '—'}</span>
        <span>{generation?.latency ? `${generation.latency}ms` : 'latency —'}</span>
      </div>

      <div className="response-text flex-1 whitespace-pre-wrap text-[15px] leading-7 text-primary" aria-live={world.status === 'streaming' ? 'polite' : 'off'}>
        {text ? <>{before}{after ? <mark>{after}</mark> : null}</> : <span className="text-secondary">No generation yet.</span>}
      </div>

      {generation?.error ? (
        <div className="mt-4 border border-danger p-3 text-sm text-danger">
          <p>{generation.error}</p>
          <div className="mt-3 flex gap-2">
            <button className="text-primary underline underline-offset-4" onClick={(event) => { event.stopPropagation(); onRun(); }}>Retry</button>
            {world.modelConfig.provider !== 'mock' ? <button className="text-primary underline underline-offset-4" onClick={(event) => { event.stopPropagation(); updateWorld(world.id, { modelConfig: { provider: 'mock', model: 'latent-mock-reasoner' } }); }}>Switch to mock</button> : null}
          </div>
        </div>
      ) : null}
      {bundle.divergenceReport && bundle.divergenceReport.worldIds.includes(world.id) ? (
        <p className="mt-4 font-mono text-xs text-signal">Divergence after character {bundle.divergenceReport.divergenceCharacterIndex}</p>
      ) : null}

      <footer className="mt-6 flex flex-wrap gap-2">
        <Button variant="primary" onClick={(event) => { event.stopPropagation(); onRun(); }}>{world.status === 'streaming' ? 'Restart' : 'Run'}</Button>
        <Button variant="secondary" onClick={(event) => { event.stopPropagation(); onStop(); }} disabled={world.status !== 'streaming'}>Stop</Button>
        <Button variant="secondary" onClick={(event) => { event.stopPropagation(); onBranch(); }}>Branch</Button>
        <Button variant="ghost" onClick={(event) => { event.stopPropagation(); openInspector(world.id); }}>Inspect</Button>
      </footer>
    </motion.article>
  );
}
