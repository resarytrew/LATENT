'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';
import { deleteExperiment, duplicateExperiment, importExperimentJson, listExperiments, saveExperiment, type StoredExperimentRecord } from '@/features/experiment/services/persistence';

export function SavedExperiments({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [records, setRecords] = useState<StoredExperimentRecord[]>([]);
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    listExperiments().then(setRecords).catch(() => setError('IndexedDB is unavailable. You can still import/export JSON manually.'));
  };
  useEffect(refresh, []);

  async function onImport(file?: File) {
    if (!file) return;
    try {
      const bundle = importExperimentJson(await file.text());
      await saveExperiment(bundle);
      router.push(`/experiment/${bundle.experiment.id}`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Imported JSON is damaged or unsupported.');
    }
  }

  return (
    <Modal title="Saved experiments" onClose={onClose}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-secondary">Local IndexedDB only. No API keys are stored.</p>
        <div>
          <input ref={fileRef} className="hidden" type="file" accept="application/json" onChange={(event) => void onImport(event.target.files?.[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import JSON</Button>
        </div>
      </div>
      {error ? <p className="mb-4 border border-danger p-3 text-sm text-danger">{error}</p> : null}
      <div className="divide-y divide-hairline border-y border-hairline">
        {records.length === 0 ? <p className="py-10 text-center text-secondary">No saved experiments yet.</p> : null}
        {records.map((record) => (
          <article key={record.id} className="grid gap-4 py-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-lg font-medium">{record.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-secondary">{record.question}</p>
              <p className="mt-3 font-mono text-xs text-secondary">{record.worldCount} worlds · {record.status} · {new Date(record.updatedAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => router.push(`/experiment/${record.id}`)}>Open</Button>
              <Button variant="secondary" onClick={async () => { const clone = await duplicateExperiment(record.id); if (clone) router.push(`/experiment/${clone.experiment.id}`); }}>Duplicate</Button>
              <Button variant="danger" onClick={async () => { await deleteExperiment(record.id); refresh(); }}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
    </Modal>
  );
}
