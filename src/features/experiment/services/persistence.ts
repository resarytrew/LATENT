import Dexie, { type EntityTable } from 'dexie';
import type { ExperimentBundle } from '@/features/experiment/model/types';
import { migrateExperimentBundle } from '@/features/experiment/services/migrations';
import { parseExperimentBundle } from '@/features/experiment/services/schema';

export interface StoredExperimentRecord {
  id: string;
  title: string;
  question: string;
  updatedAt: string;
  worldCount: number;
  status: string;
  bundle: ExperimentBundle;
}

class LatentDb extends Dexie {
  experiments!: EntityTable<StoredExperimentRecord, 'id'>;

  constructor() {
    super('latent-local');
    this.version(1).stores({ experiments: 'id, updatedAt, title, status' });
  }
}

let dbInstance: LatentDb | undefined;
function getDb(): LatentDb {
  if (!dbInstance) dbInstance = new LatentDb();
  return dbInstance;
}

export async function saveExperiment(bundle: ExperimentBundle): Promise<void> {
  const db = getDb();
  const updatedBundle = { ...bundle, experiment: { ...bundle.experiment, updatedAt: new Date().toISOString() } };
  await db.experiments.put({
    id: updatedBundle.experiment.id,
    title: updatedBundle.experiment.title,
    question: updatedBundle.experiment.question,
    updatedAt: updatedBundle.experiment.updatedAt,
    worldCount: updatedBundle.experiment.worldIds.length,
    status: updatedBundle.experiment.status,
    bundle: updatedBundle
  });
}

export async function loadExperiment(id: string): Promise<ExperimentBundle | undefined> {
  const record = await getDb().experiments.get(id);
  return record ? migrateExperimentBundle(parseExperimentBundle(record.bundle)) : undefined;
}

export async function listExperiments(): Promise<StoredExperimentRecord[]> {
  return getDb().experiments.orderBy('updatedAt').reverse().toArray();
}

export async function deleteExperiment(id: string): Promise<void> {
  await getDb().experiments.delete(id);
}

export async function duplicateExperiment(id: string): Promise<ExperimentBundle | undefined> {
  const record = await loadExperiment(id);
  if (!record) return undefined;
  const clone = structuredClone(record) as ExperimentBundle;
  const suffix = Math.random().toString(36).slice(2, 8);
  clone.experiment.id = `${clone.experiment.id}_copy_${suffix}`;
  clone.experiment.title = `${clone.experiment.title} copy`;
  clone.experiment.createdAt = new Date().toISOString();
  clone.experiment.updatedAt = clone.experiment.createdAt;
  Object.values(clone.worlds).forEach((world) => {
    world.experimentId = clone.experiment.id;
  });
  await saveExperiment(clone);
  return clone;
}

export function exportExperimentJson(bundle: ExperimentBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function importExperimentJson(json: string): ExperimentBundle {
  return migrateExperimentBundle(parseExperimentBundle(JSON.parse(json)));
}

export async function resetPersistenceForTests(): Promise<void> {
  if (dbInstance) await dbInstance.delete();
  dbInstance = undefined;
}
