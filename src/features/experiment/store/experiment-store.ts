'use client';

import { create } from 'zustand';
import type { Generation, GenerationChunk, Usage } from '@/entities/generation/types';
import type { TimelineEvent } from '@/entities/event/types';
import type { ModelConfig, World } from '@/entities/world/types';
import type { DivergenceReport } from '@/features/divergence/model/types';
import type { ExperimentBundle } from '@/features/experiment/model/types';
import { accentForIndex, createExperimentBundle, createTimelineEvent, nextWorldName } from '@/features/experiment/services/factory';
import { diffModelConfig } from '@/features/worlds/services/config-diff';
import { createId, nowIso } from '@/shared/lib/id';

type BranchPreset = 'temperature' | 'system' | 'model' | 'duplicate' | 'custom';

type Patch = Partial<Omit<World, 'modelConfig'>> & { modelConfig?: Partial<ModelConfig> };

interface ExperimentStore {
  bundle?: ExperimentBundle;
  activeWorldId?: string;
  inspectorWorldId?: string;
  compareOpen: boolean;
  commandOpen: boolean;
  savedOpen: boolean;
  selectedEventId?: string;
  scrubSequence?: number;
  isTimelinePlaying: boolean;
  notice?: string;
  createExperiment(question: string, provider: 'mock' | 'openai-compatible'): ExperimentBundle;
  setBundle(bundle: ExperimentBundle): void;
  clearNotice(): void;
  selectWorld(worldId: string): void;
  setInspectorWorld(worldId?: string): void;
  toggleCompare(force?: boolean): void;
  setCommandOpen(open: boolean): void;
  setSavedOpen(open: boolean): void;
  setTheme(theme: 'light' | 'dark'): void;
  renameExperiment(title: string): void;
  updateWorld(worldId: string, patch: Patch): void;
  branchWorld(parentWorldId: string, preset: BranchPreset, branchPointEventId?: string): string | undefined;
  startGeneration(worldId: string): Generation | undefined;
  appendGenerationChunk(worldId: string, payload: { index: number; text: string; timestamp?: string; tokenIndex?: number; source: 'real' | 'simulated' }): void;
  completeGeneration(worldId: string, payload: { usage?: Usage; latency?: number; finishReason?: Generation['finishReason'] }): void;
  failGeneration(worldId: string, error: string, aborted?: boolean): void;
  setDivergenceReport(report: DivergenceReport): void;
  selectEvent(eventId?: string): void;
  setScrubSequence(sequence?: number): void;
  toggleTimelinePlayback(force?: boolean): void;
  branchFromSelectedEvent(): string | undefined;
}

function touch(bundle: ExperimentBundle): ExperimentBundle {
  return { ...bundle, experiment: { ...bundle.experiment, updatedAt: nowIso() } };
}

function maxSequence(bundle: ExperimentBundle): number {
  return Math.max(0, ...Object.values(bundle.events).map((event) => event.sequence));
}

function addEvent(bundle: ExperimentBundle, worldId: string, type: TimelineEvent['type'], payload: TimelineEvent['payload'] = {}): { bundle: ExperimentBundle; event: TimelineEvent } {
  const event = createTimelineEvent(worldId, type, maxSequence(bundle) + 1, payload);
  return { bundle: { ...bundle, events: { ...bundle.events, [event.id]: event } }, event };
}

function patchWorld(world: World, patch: Patch): World {
  return { ...world, ...patch, modelConfig: patch.modelConfig ? { ...world.modelConfig, ...patch.modelConfig } : world.modelConfig };
}

function nextTemperature(current: number): number {
  if (current < 0.3) return 0.8;
  if (current < 0.7) return 1.0;
  return 0.1;
}

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  compareOpen: false,
  commandOpen: false,
  savedOpen: false,
  isTimelinePlaying: false,

  createExperiment(question, provider) {
    const bundle = createExperimentBundle(question, provider);
    set({ bundle, activeWorldId: bundle.experiment.rootWorldId, inspectorWorldId: undefined, compareOpen: false, scrubSequence: undefined });
    return bundle;
  },

  setBundle(bundle) {
    set({ bundle, activeWorldId: bundle.experiment.selectedWorldIds[0] ?? bundle.experiment.rootWorldId, scrubSequence: undefined, compareOpen: false });
  },

  clearNotice() {
    set({ notice: undefined });
  },

  selectWorld(worldId) {
    set((state) => {
      if (!state.bundle) return {};
      return {
        activeWorldId: worldId,
        bundle: touch({ ...state.bundle, experiment: { ...state.bundle.experiment, selectedWorldIds: [worldId] } })
      };
    });
  },

  setInspectorWorld(worldId) {
    set({ inspectorWorldId: worldId });
  },

  toggleCompare(force) {
    set((state) => ({ compareOpen: force ?? !state.compareOpen }));
  },

  setCommandOpen(open) {
    set({ commandOpen: open });
  },

  setSavedOpen(open) {
    set({ savedOpen: open });
  },

  setTheme(theme) {
    set((state) => (state.bundle ? { bundle: touch({ ...state.bundle, settings: { ...state.bundle.settings, theme } }) } : {}));
  },

  renameExperiment(title) {
    set((state) => (state.bundle ? { bundle: touch({ ...state.bundle, experiment: { ...state.bundle.experiment, title } }) } : {}));
  },

  updateWorld(worldId, patch) {
    set((state) => {
      const bundle = state.bundle;
      const world = bundle?.worlds[worldId];
      if (!bundle || !world) return {};
      const updated = patchWorld(world, patch);
      let next = touch({ ...bundle, worlds: { ...bundle.worlds, [worldId]: updated } });
      const parameterDiff = diffModelConfig(world.modelConfig, updated.modelConfig);
      if (parameterDiff.length > 0 || patch.systemPrompt !== undefined || patch.prompt !== undefined) {
        const added = addEvent(next, worldId, 'parameter.changed', { patch, diff: parameterDiff });
        next = added.bundle;
      }
      return { bundle: next };
    });
  },

  branchWorld(parentWorldId, preset, branchPointEventId) {
    const state = get();
    const bundle = state.bundle;
    const parent = bundle?.worlds[parentWorldId];
    if (!bundle || !parent || bundle.experiment.worldIds.length >= 4) {
      set({ notice: 'A maximum of four worlds can exist in the first stage.' });
      return undefined;
    }
    const index = bundle.experiment.worldIds.length;
    const id = createId('world');
    const child: World = {
      ...parent,
      id,
      parentWorldId,
      branchPointEventId,
      name: nextWorldName(index),
      accent: accentForIndex(index),
      status: 'ready',
      generationId: undefined,
      createdAt: nowIso()
    };
    if (preset === 'temperature') child.modelConfig = { ...child.modelConfig, temperature: nextTemperature(parent.modelConfig.temperature), seed: (parent.modelConfig.seed ?? 42) + index };
    if (preset === 'system') child.systemPrompt = 'You are a skeptical reviewer. Challenge the first obvious answer and state limits clearly.';
    if (preset === 'model') child.modelConfig = { ...child.modelConfig, model: child.modelConfig.provider === 'mock' ? 'latent-mock-compact' : child.modelConfig.model };
    if (preset === 'custom') child.modelConfig = { ...child.modelConfig, temperature: Math.min(1.2, parent.modelConfig.temperature + 0.2) };

    let next = touch({
      ...bundle,
      experiment: { ...bundle.experiment, worldIds: [...bundle.experiment.worldIds, id], selectedWorldIds: [id] },
      worlds: { ...bundle.worlds, [id]: child }
    });
    const branched = addEvent(next, id, 'world.branched', { parentWorldId, branchPointEventId, preset });
    next = branched.bundle;
    const branchCreated = addEvent(next, id, 'branch.created', { parentWorldId, branchPointEventId, note: 'Branch copied visible prompt and settings. Hidden model state is not available.' });
    next = branchCreated.bundle;
    set({ bundle: next, activeWorldId: id, inspectorWorldId: id, notice: branchPointEventId ? 'New branch created from the selected timeline point. The provider will restart from prompt and settings, not hidden model state.' : undefined });
    return id;
  },

  startGeneration(worldId) {
    const state = get();
    const bundle = state.bundle;
    const world = bundle?.worlds[worldId];
    if (!bundle || !world) return undefined;
    const generation: Generation = { id: createId('gen'), worldId, status: 'streaming', startedAt: nowIso(), text: '', chunks: [] };
    let next = touch({
      ...bundle,
      experiment: { ...bundle.experiment, status: 'running' },
      worlds: { ...bundle.worlds, [worldId]: { ...world, status: 'streaming', generationId: generation.id } },
      generations: { ...bundle.generations, [generation.id]: generation }
    });
    next = addEvent(next, worldId, 'generation.started', { generationId: generation.id }).bundle;
    set({ bundle: next, scrubSequence: undefined });
    return generation;
  },

  appendGenerationChunk(worldId, payload) {
    set((state) => {
      const bundle = state.bundle;
      const world = bundle?.worlds[worldId];
      const generation = world?.generationId ? bundle?.generations[world.generationId] : undefined;
      if (!bundle || !world || !generation) return {};
      const chunk: GenerationChunk = {
        id: createId('chunk'),
        generationId: generation.id,
        index: payload.index,
        text: payload.text,
        timestamp: payload.timestamp ?? nowIso(),
        tokenIndex: payload.tokenIndex,
        source: payload.source
      };
      const nextGeneration = { ...generation, text: generation.text + chunk.text, chunks: [...generation.chunks, chunk] };
      let next = touch({ ...bundle, generations: { ...bundle.generations, [generation.id]: nextGeneration } });
      next = addEvent(next, worldId, 'generation.chunk', { generationId: generation.id, chunkId: chunk.id, text: chunk.text, index: chunk.index }).bundle;
      return { bundle: next };
    });
  },

  completeGeneration(worldId, payload) {
    set((state) => {
      const bundle = state.bundle;
      const world = bundle?.worlds[worldId];
      const generation = world?.generationId ? bundle?.generations[world.generationId] : undefined;
      if (!bundle || !world || !generation) return {};
      const completed: Generation = { ...generation, status: 'completed', completedAt: nowIso(), usage: payload.usage ?? generation.usage, latency: payload.latency, finishReason: payload.finishReason ?? 'stop' };
      const statuses = Object.values(bundle.worlds).map((candidate) => (candidate.id === worldId ? 'completed' : candidate.status));
      const experimentStatus = statuses.every((status) => status === 'completed') ? 'completed' : statuses.some((status) => status === 'failed') ? 'partial-failure' : bundle.experiment.status;
      let next = touch({
        ...bundle,
        experiment: { ...bundle.experiment, status: experimentStatus },
        worlds: { ...bundle.worlds, [worldId]: { ...world, status: 'completed' } },
        generations: { ...bundle.generations, [generation.id]: completed }
      });
      next = addEvent(next, worldId, 'generation.completed', { generationId: generation.id, latency: payload.latency, finishReason: completed.finishReason }).bundle;
      return { bundle: next };
    });
  },

  failGeneration(worldId, error, aborted = false) {
    set((state) => {
      const bundle = state.bundle;
      const world = bundle?.worlds[worldId];
      const generation = world?.generationId ? bundle?.generations[world.generationId] : undefined;
      if (!bundle || !world || !generation) return {};
      const status = aborted ? 'aborted' : 'failed';
      let next = touch({
        ...bundle,
        experiment: { ...bundle.experiment, status: aborted ? bundle.experiment.status : 'partial-failure' },
        worlds: { ...bundle.worlds, [worldId]: { ...world, status } },
        generations: { ...bundle.generations, [generation.id]: { ...generation, status, completedAt: nowIso(), error, finishReason: aborted ? 'aborted' : 'error' } }
      });
      next = addEvent(next, worldId, 'generation.failed', { generationId: generation.id, error, aborted }).bundle;
      return { bundle: next };
    });
  },

  setDivergenceReport(report) {
    set((state) => {
      if (!state.bundle) return {};
      let next = touch({ ...state.bundle, divergenceReport: report });
      const worldId = report.worldIds[0] ?? state.bundle.experiment.rootWorldId;
      next = addEvent(next, worldId, 'divergence.detected', { divergenceCharacterIndex: report.divergenceCharacterIndex, divergenceWordIndex: report.divergenceWordIndex }).bundle;
      return { bundle: next };
    });
  },

  selectEvent(eventId) {
    const event = eventId ? get().bundle?.events[eventId] : undefined;
    set({ selectedEventId: eventId, scrubSequence: event?.sequence });
  },

  setScrubSequence(sequence) {
    set({ scrubSequence: sequence });
  },

  toggleTimelinePlayback(force) {
    set((state) => ({ isTimelinePlaying: force ?? !state.isTimelinePlaying }));
  },

  branchFromSelectedEvent() {
    const state = get();
    const event = state.selectedEventId && state.bundle?.events[state.selectedEventId];
    if (!event) {
      set({ notice: 'Select a timeline event before branching.' });
      return undefined;
    }
    return get().branchWorld(event.worldId, 'duplicate', event.id);
  }
}));

export function selectWorlds(bundle?: ExperimentBundle): World[] {
  if (!bundle) return [];
  return bundle.experiment.worldIds.map((id) => bundle.worlds[id]).filter(Boolean);
}

export function visibleTextForWorld(bundle: ExperimentBundle | undefined, worldId: string, scrubSequence?: number): string {
  if (!bundle) return '';
  const world = bundle.worlds[worldId];
  const generation = world?.generationId ? bundle.generations[world.generationId] : undefined;
  if (!generation) return '';
  if (scrubSequence === undefined) return generation.text;
  const visibleChunkIds = new Set(
    Object.values(bundle.events)
      .filter((event) => event.worldId === worldId && event.type === 'generation.chunk' && event.sequence <= scrubSequence)
      .map((event) => (event.payload as { chunkId?: string }).chunkId)
  );
  return generation.chunks.filter((chunk) => visibleChunkIds.has(chunk.id)).map((chunk) => chunk.text).join('');
}
