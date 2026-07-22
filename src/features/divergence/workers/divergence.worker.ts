import { calculateDivergenceReport } from '@/features/divergence/services/engine';
import type { DivergenceInput } from '@/features/divergence/model/types';

self.onmessage = (event: MessageEvent<DivergenceInput>) => {
  const report = calculateDivergenceReport(event.data);
  self.postMessage(report);
};
