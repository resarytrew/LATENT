'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DivergenceInput, DivergenceReport } from '@/features/divergence/model/types';

export function useDivergenceWorker(onReport: (report: DivergenceReport) => void) {
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    workerRef.current = new Worker(new URL('./workers/divergence.worker.ts', import.meta.url));
    workerRef.current.onmessage = (event: MessageEvent<DivergenceReport>) => onReport(event.data);
    return () => workerRef.current?.terminate();
  }, [onReport]);

  return useCallback((input: DivergenceInput) => workerRef.current?.postMessage(input), []);
}
