'use client';

import { useEffect, useRef } from 'react';
import type { ExperimentBundle } from '@/features/experiment/model/types';
import { saveExperiment } from '@/features/experiment/services/persistence';

export function useAutosave(bundle?: ExperimentBundle) {
  const lastSaved = useRef<string>('');
  useEffect(() => {
    if (!bundle) return;
    const serialized = JSON.stringify(bundle);
    if (serialized === lastSaved.current) return;
    const handle = window.setTimeout(() => {
      saveExperiment(bundle)
        .then(() => {
          lastSaved.current = serialized;
        })
        .catch(() => {
          // IndexedDB can be unavailable in private browsing. The UI exposes manual JSON export as fallback.
        });
    }, 700);
    return () => window.clearTimeout(handle);
  }, [bundle]);
}
