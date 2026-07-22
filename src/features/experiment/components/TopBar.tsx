'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { exportExperimentJson, importExperimentJson, saveExperiment } from '@/features/experiment/services/persistence';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';

export function TopBar({ onRunAll, onStopAll }: { onRunAll: () => void; onStopAll: () => void }) {
  const router = useRouter();
  const bundle = useExperimentStore((state) => state.bundle);
  const setTheme = useExperimentStore((state) => state.setTheme);
  const setCommandOpen = useExperimentStore((state) => state.setCommandOpen);
  const setSavedOpen = useExperimentStore((state) => state.setSavedOpen);
  const setBundle = useExperimentStore((state) => state.setBundle);
  const [message, setMessage] = useState<string>();
  const importRef = useRef<HTMLInputElement>(null);
  if (!bundle) return null;
  const currentBundle = bundle;

  async function manualSave() {
    try {
      await saveExperiment(currentBundle);
      setMessage('Saved locally');
    } catch {
      setMessage('IndexedDB unavailable. Export JSON as fallback.');
    }
  }

  function exportJson() {
    const blob = new Blob([exportExperimentJson(currentBundle)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBundle.experiment.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${currentBundle.experiment.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(file?: File) {
    if (!file) return;
    try {
      const imported = importExperimentJson(await file.text());
      setBundle(imported);
      await saveExperiment(imported);
      router.push(`/experiment/${imported.experiment.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid JSON import.');
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-background/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <button className="font-mono text-sm tracking-[0.32em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={() => router.push('/')}>LATENT</button>
          <div>
            <h1 className="text-lg font-normal tracking-[-0.03em]">{bundle.experiment.title}</h1>
            <p className="font-mono text-xs text-secondary">{bundle.experiment.status} · {bundle.settings.providerPreference}</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Workspace actions">
          {message ? <span className="font-mono text-xs text-secondary" aria-live="polite">{message}</span> : null}
          <Button variant="secondary" onClick={onRunAll}>Run all</Button>
          <Button variant="secondary" onClick={onStopAll}>Stop all</Button>
          <Button variant="secondary" onClick={() => void manualSave()}>Save</Button>
          <Button variant="ghost" onClick={exportJson}>Export JSON</Button>
          <input ref={importRef} className="hidden" type="file" accept="application/json" onChange={(event) => void onImport(event.target.files?.[0])} />
          <Button variant="ghost" onClick={() => importRef.current?.click()}>Import</Button>
          <Button variant="ghost" disabled title="Coming later">Share</Button>
          <Button variant="ghost" onClick={() => setTheme(bundle.settings.theme === 'light' ? 'dark' : 'light')}>{bundle.settings.theme === 'light' ? 'Dark' : 'Light'}</Button>
          <Button variant="ghost" onClick={() => setSavedOpen(true)}>Saved</Button>
          <Button variant="secondary" onClick={() => setCommandOpen(true)}>⌘K</Button>
        </nav>
      </div>
    </header>
  );
}
