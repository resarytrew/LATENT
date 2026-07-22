'use client';

import { useEffect, useMemo } from 'react';
import type { TimelineEvent } from '@/entities/event/types';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';
import { Button } from '@/shared/ui/button';
import { cx } from '@/shared/lib/cx';

const labels: Record<TimelineEvent['type'], string> = {
  'world.created': 'created',
  'world.branched': 'branched',
  'generation.started': 'start',
  'generation.chunk': 'chunk',
  'generation.completed': 'done',
  'generation.failed': 'failed',
  'parameter.changed': 'param',
  'divergence.detected': 'diverge',
  'playback.paused': 'pause',
  'branch.created': 'branch'
};

export function GlobalTimeline() {
  const bundle = useExperimentStore((state) => state.bundle);
  const scrubSequence = useExperimentStore((state) => state.scrubSequence);
  const setScrub = useExperimentStore((state) => state.setScrubSequence);
  const selectedEventId = useExperimentStore((state) => state.selectedEventId);
  const selectEvent = useExperimentStore((state) => state.selectEvent);
  const playing = useExperimentStore((state) => state.isTimelinePlaying);
  const toggle = useExperimentStore((state) => state.toggleTimelinePlayback);
  const branchFromSelectedEvent = useExperimentStore((state) => state.branchFromSelectedEvent);
  const events = useMemo(() => Object.values(bundle?.events ?? {}).sort((a, b) => a.sequence - b.sequence), [bundle?.events]);
  const max = events.at(-1)?.sequence ?? 1;
  const current = scrubSequence ?? max;

  useEffect(() => {
    if (!playing) return;
    const handle = window.setInterval(() => {
      const state = useExperimentStore.getState();
      const allEvents = Object.values(state.bundle?.events ?? {}).sort((a, b) => a.sequence - b.sequence);
      const latest = allEvents.at(-1)?.sequence ?? 1;
      const next = Math.min((state.scrubSequence ?? 0) + 1, latest);
      state.setScrubSequence(next);
      if (next >= latest) state.toggleTimelinePlayback(false);
    }, 180);
    return () => window.clearInterval(handle);
  }, [playing]);

  if (!bundle) return null;
  const worlds = bundle.experiment.worldIds.map((id) => bundle.worlds[id]).filter(Boolean);

  return (
    <section className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-background/95 px-4 py-3 backdrop-blur-sm" aria-label="Global timeline">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Button variant="secondary" onClick={() => toggle()}>{playing ? 'Pause' : 'Play'}</Button><Button variant="ghost" onClick={() => branchFromSelectedEvent()}>Branch from event</Button></div>
          <label className="flex flex-1 items-center gap-3 font-mono text-xs text-secondary">
            <span>Scrub</span>
            <input aria-label="Timeline scrubber" type="range" min={1} max={max} value={current} onChange={(event) => setScrub(Number(event.target.value))} className="w-full accent-signal" />
            <span>{current}/{max}</span>
          </label>
        </div>
        <div className="space-y-1">
          {worlds.map((world) => {
            const worldEvents = events.filter((event) => event.worldId === world.id);
            return (
              <div key={world.id} className="grid grid-cols-[80px_1fr] items-center gap-3">
                <span className="font-mono text-xs text-secondary">{world.name}</span>
                <div className="relative h-5 border-t border-hairline">
                  {worldEvents.map((event) => (
                    <button
                      key={event.id}
                      aria-label={`${world.name} ${labels[event.type]} at ${event.sequence}`}
                      title={`${labels[event.type]} · ${event.sequence}`}
                      onClick={() => selectEvent(event.id)}
                      className={cx('absolute top-[-5px] h-2.5 w-2.5 -translate-x-1/2 border border-primary bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal', event.type === 'divergence.detected' && 'border-signal bg-signal', event.type === 'generation.failed' && 'border-danger', selectedEventId === event.id && 'h-4 w-4 border-signal')}
                      style={{ left: `${(event.sequence / max) * 100}%` }}
                    />
                  ))}
                  <span className="absolute top-[-10px] h-5 border-l-2 border-signal" style={{ left: `${(current / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
