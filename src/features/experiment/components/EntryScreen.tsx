'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/field';
import { SavedExperiments } from '@/features/experiment/components/SavedExperiments';
import { saveExperiment } from '@/features/experiment/services/persistence';
import { useExperimentStore } from '@/features/experiment/store/experiment-store';

const examples = ['Explain why the sky is blue.', 'Design a city without cars.', 'Should AI make medical decisions?'];

export function EntryScreen() {
  const router = useRouter();
  const createExperiment = useExperimentStore((state) => state.createExperiment);
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mock' | 'openai-compatible'>('mock');
  const [savedOpen, setSavedOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function start() {
    if (!prompt.trim()) return;
    const bundle = createExperiment(prompt.trim(), provider);
    try {
      await saveExperiment(bundle);
    } catch {
      setError('IndexedDB is unavailable. The experiment will run, but autosave may not persist. Export JSON as fallback.');
    }
    router.push(`/experiment/${bundle.experiment.id}`);
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <div className="font-mono text-sm tracking-[0.32em]">LATENT</div>
        <button className="text-sm text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={() => setSavedOpen(true)}>Open saved experiment</button>
      </header>
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.24em] text-secondary">Change one thing. Watch intelligence diverge.</p>
          <h1 className="text-5xl font-normal tracking-[-0.05em] md:text-7xl">What do you want to test?</h1>
          <div className="mt-10">
            <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Enter one source prompt…" aria-label="Source prompt" autoFocus />
          </div>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm text-secondary">
              Provider
              <select className="border border-hairline bg-surface px-3 py-2 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" value={provider} onChange={(event) => setProvider(event.target.value as 'mock' | 'openai-compatible')}>
                <option value="mock">Mock mode</option>
                <option value="openai-compatible">External if configured</option>
              </select>
            </label>
            <Button variant="primary" onClick={() => void start()} disabled={!prompt.trim()}>Start experiment</Button>
          </div>
          {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Prompt examples">
            {examples.map((example) => (
              <button key={example} className="border border-hairline px-3 py-2 text-sm text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal" onClick={() => setPrompt(example)}>
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </section>
      {savedOpen ? <SavedExperiments onClose={() => setSavedOpen(false)} /> : null}
    </main>
  );
}
