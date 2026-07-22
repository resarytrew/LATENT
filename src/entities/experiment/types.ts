export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'partial-failure' | 'saved';

export interface Experiment {
  id: string;
  title: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  rootWorldId: string;
  worldIds: string[];
  selectedWorldIds: string[];
  status: ExperimentStatus;
  version: number;
}
