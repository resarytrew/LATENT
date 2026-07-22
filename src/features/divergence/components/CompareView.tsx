'use client';

import { motion } from 'framer-motion';
import { visibleTextForWorld, useExperimentStore } from '@/features/experiment/store/experiment-store';
import { diffWorldFromParent, formatConfigValue } from '@/features/worlds/services/config-diff';
import { Button } from '@/shared/ui/button';
import { Tooltip } from '@/shared/ui/tooltip';

function percent(value?: number) {
  return value === undefined ? '—' : `${Math.round(value * 100)}%`;
}

export function CompareView() {
  const bundle = useExperimentStore((state) => state.bundle);
  const close = useExperimentStore((state) => state.toggleCompare);
  const branch = useExperimentStore((state) => state.branchFromSelectedEvent);
  if (!bundle) return null;
  const report = bundle.divergenceReport;
  const worlds = bundle.experiment.worldIds.map((id) => bundle.worlds[id]).filter(Boolean);
  return (
    <motion.section layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-30 overflow-auto bg-background p-6 md:p-10" aria-label="Compare worlds">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-secondary">Compare</p>
          <h2 className="mt-2 text-4xl font-normal tracking-[-0.05em]">Model Divergence</h2>
        </div>
        <div className="flex gap-2"><Button variant="secondary" onClick={() => branch()}>Branch from selected event</Button><Button variant="ghost" onClick={() => close(false)}>Close</Button></div>
      </header>

      {!report ? <p className="border border-hairline p-5 text-secondary">Run at least two worlds to calculate divergence. Metrics are text heuristics, not causal attribution.</p> : (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-5">
            <Metric label="Same until" value={`char ${report.divergenceCharacterIndex}`} tooltip="Common prefix length after whitespace normalization. It marks the first character index where at least one response differs." />
            <Metric label="First divergence" value={`word ${report.divergenceWordIndex}`} tooltip="Number of word tokens in the shared prefix before the first text divergence." />
            <Metric label="Lexical overlap" value={percent(report.mostSimilarPair?.lexicalOverlap)} tooltip="Jaccard similarity over unique lowercase word tokens: intersection divided by union." />
            <Metric label="Structural difference" value={percent(report.mostDifferentPair?.normalizedEditDistance)} tooltip="Normalized Levenshtein edit distance: edits divided by the length of the longer response. Higher means more different." />
            <Metric label="Length difference" value={`${Math.max(...Object.values(report.responseLengths)) - Math.min(...Object.values(report.responseLengths))} chars`} tooltip="Difference between the longest and shortest normalized response length." />
          </div>
          {report.warnings.map((warning) => <p key={warning} className="mb-4 border border-hairline p-3 text-sm text-secondary">{warning}</p>)}
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {worlds.map((world) => {
          const text = visibleTextForWorld(bundle, world.id);
          const divergenceIndex = report?.divergenceCharacterIndex ?? text.length;
          return (
            <article key={world.id} className="border-l border-hairline pl-4">
              <h3 className="text-xl font-normal">{world.name}</h3>
              <p className="mt-1 font-mono text-xs text-secondary">{world.modelConfig.model} · temp {world.modelConfig.temperature}</p>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7"><span>{text.slice(0, divergenceIndex)}</span>{text.length > divergenceIndex ? <mark className="bg-transparent text-signal">{text.slice(divergenceIndex)}</mark> : null}</p>
            </article>
          );
        })}
      </div>

      <section className="mt-10 border-t border-hairline pt-8">
        <h3 className="text-xl font-medium">Differing parameters</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead><tr className="border-b border-hairline text-left text-secondary"><th className="py-2">World</th><th>Parent diff</th><th>Usage</th><th>Latency</th><th>Length</th></tr></thead>
            <tbody>
              {worlds.map((world) => {
                const parent = world.parentWorldId ? bundle.worlds[world.parentWorldId] : undefined;
                const diff = diffWorldFromParent(parent, world);
                const generation = world.generationId ? bundle.generations[world.generationId] : undefined;
                return (
                  <tr key={world.id} className="border-b border-hairline align-top">
                    <td className="py-3 pr-4">{world.name}</td>
                    <td className="py-3 pr-4">{diff.length ? diff.map((item) => `${item.key}: ${formatConfigValue(item.parentValue)}→${formatConfigValue(item.childValue)}`).join('; ') : '—'}</td>
                    <td className="py-3 pr-4">{generation?.usage?.totalTokens ?? 'unavailable'} {generation?.usage?.source ?? ''}</td>
                    <td className="py-3 pr-4">{generation?.latency ? `${generation.latency}ms` : 'unavailable'}</td>
                    <td className="py-3 pr-4">{report?.responseLengths[world.id] ?? visibleTextForWorld(bundle, world.id).length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </motion.section>
  );
}

function Metric({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return <div className="border-t border-hairline pt-3"><dt className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-secondary">{label}<Tooltip label={tooltip} /></dt><dd className="mt-2 text-2xl font-normal">{value}</dd></div>;
}
