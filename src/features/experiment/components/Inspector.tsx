'use client';

import { motion } from 'framer-motion';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';
import { diffWorldFromParent, formatConfigValue } from '@/features/worlds/services/config-diff';
import { Button } from '@/shared/ui/button';
import { Input, Label, Textarea } from '@/shared/ui/field';

export function Inspector() {
  const bundle = useExperimentStore((state) => state.bundle);
  const worldId = useExperimentStore((state) => state.inspectorWorldId);
  const close = useExperimentStore((state) => state.setInspectorWorld);
  const updateWorld = useExperimentStore((state) => state.updateWorld);
  if (!bundle || !worldId) return null;
  const world = bundle.worlds[worldId];
  if (!world) return null;
  const parent = world.parentWorldId ? bundle.worlds[world.parentWorldId] : undefined;
  const diff = diffWorldFromParent(parent, world);
  const generation = world.generationId ? bundle.generations[world.generationId] : undefined;

  return (
    <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ duration: 0.22 }} className="fixed right-0 top-0 z-40 h-full w-full max-w-[380px] overflow-auto border-l border-hairline bg-background p-6" aria-label="Inputs and Conditions inspector">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">Inputs & Conditions</p>
          <h2 className="mt-1 text-2xl font-normal">{world.name}</h2>
        </div>
        <Button variant="ghost" onClick={() => close(undefined)}>Esc</Button>
      </div>

      <div className="space-y-5">
        <div>
          <Label>User prompt</Label>
          <Textarea className="mt-2 min-h-24 text-sm" value={world.prompt} onChange={(event) => updateWorld(world.id, { prompt: event.target.value })} />
        </div>
        <div>
          <Label>System prompt</Label>
          <Textarea className="mt-2 min-h-24 text-sm" value={world.systemPrompt} onChange={(event) => updateWorld(world.id, { systemPrompt: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Model</Label><Input className="mt-2 font-mono" value={world.modelConfig.model} onChange={(event) => updateWorld(world.id, { modelConfig: { model: event.target.value } })} /></div>
          <div><Label>Temperature</Label><Input className="mt-2 font-mono" type="number" min={0} max={2} step={0.1} value={world.modelConfig.temperature} onChange={(event) => updateWorld(world.id, { modelConfig: { temperature: Number(event.target.value) } })} /></div>
          <div><Label>topP</Label><Input className="mt-2 font-mono" type="number" min={0} max={1} step={0.05} value={world.modelConfig.topP} onChange={(event) => updateWorld(world.id, { modelConfig: { topP: Number(event.target.value) } })} /></div>
          <div><Label>Seed</Label><Input className="mt-2 font-mono" type="number" value={world.modelConfig.seed ?? ''} onChange={(event) => updateWorld(world.id, { modelConfig: { seed: event.target.value ? Number(event.target.value) : undefined } })} /></div>
          <div><Label>Max tokens</Label><Input className="mt-2 font-mono" type="number" value={world.modelConfig.maxOutputTokens} onChange={(event) => updateWorld(world.id, { modelConfig: { maxOutputTokens: Number(event.target.value) } })} /></div>
          <div><Label>Provider</Label><Input className="mt-2 font-mono" value={world.modelConfig.provider} readOnly /></div>
        </div>

        <section className="border-t border-hairline pt-5">
          <h3 className="text-lg font-medium">What changed from parent?</h3>
          {diff.length === 0 ? <p className="mt-3 text-sm text-secondary">No parent diff. This is the root world or an exact duplicate.</p> : (
            <dl className="mt-3 space-y-3">
              {diff.map((item) => (
                <div key={item.key} className="grid grid-cols-[110px_1fr] gap-2 text-sm">
                  <dt className="font-mono text-secondary">{item.key}</dt>
                  <dd className="font-mono">{formatConfigValue(item.parentValue)} → {formatConfigValue(item.childValue)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="border-t border-hairline pt-5">
          <h3 className="text-lg font-medium">Measured run data</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs text-secondary">
            <div><dt>Latency</dt><dd className="text-primary">{generation?.latency ? `${generation.latency}ms` : 'unavailable'}</dd></div>
            <div><dt>Usage</dt><dd className="text-primary">{generation?.usage?.totalTokens ?? 'unavailable'} {generation?.usage?.source ? `(${generation.usage.source})` : ''}</dd></div>
            <div><dt>Parent</dt><dd className="text-primary">{parent?.name ?? '—'}</dd></div>
            <div><dt>Status</dt><dd className="text-primary">{world.status}</dd></div>
          </dl>
        </section>
      </div>
    </motion.aside>
  );
}
