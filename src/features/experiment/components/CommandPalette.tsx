'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/shared/ui/modal';
import { Input } from '@/shared/ui/field';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';
import type { useGenerationRunner } from '@/features/experiment/hooks/use-generation-runner';
import { saveExperiment } from '@/features/experiment/services/persistence';

export function CommandPalette({ runner }: { runner: ReturnType<typeof useGenerationRunner> }) {
  const router = useRouter();
  const open = useExperimentStore((state) => state.commandOpen);
  const close = useExperimentStore((state) => state.setCommandOpen);
  const bundle = useExperimentStore((state) => state.bundle);
  const activeWorldId = useExperimentStore((state) => state.activeWorldId);
  const branchWorld = useExperimentStore((state) => state.branchWorld);
  const toggleCompare = useExperimentStore((state) => state.toggleCompare);
  const toggleTimelinePlayback = useExperimentStore((state) => state.toggleTimelinePlayback);
  const setTheme = useExperimentStore((state) => state.setTheme);
  const renameExperiment = useExperimentStore((state) => state.renameExperiment);
  const setSavedOpen = useExperimentStore((state) => state.setSavedOpen);
  const [query, setQuery] = useState('');
  if (!open || !bundle) return null;
  const commands = [
    { label: 'Create world', run: () => activeWorldId && branchWorld(activeWorldId, 'custom') },
    { label: 'Duplicate active world', run: () => activeWorldId && branchWorld(activeWorldId, 'duplicate') },
    { label: 'Run all worlds', run: runner.runAll },
    { label: 'Stop all', run: runner.stopAll },
    { label: 'Open compare', run: () => toggleCompare(true) },
    { label: 'Open timeline', run: () => toggleTimelinePlayback(true) },
    { label: 'Save experiment', run: () => void saveExperiment(bundle) },
    { label: 'Rename experiment', run: () => { const title = window.prompt('New experiment title', bundle.experiment.title); if (title) renameExperiment(title); } },
    { label: 'Switch theme', run: () => setTheme(bundle.settings.theme === 'light' ? 'dark' : 'light') },
    { label: 'Open saved experiments', run: () => setSavedOpen(true) }
  ].filter((command) => command.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal title="Command palette" onClose={() => close(false)}>
      <Input autoFocus placeholder="Type a command…" value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className="mt-4 divide-y divide-hairline border-y border-hairline">
        {commands.map((command) => (
          <button key={command.label} className="block w-full px-2 py-3 text-left text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={() => { command.run(); close(false); }}>
            {command.label}
          </button>
        ))}
      </div>
      <button className="mt-4 text-sm text-secondary" onClick={() => router.push('/')}>New entry screen</button>
    </Modal>
  );
}
