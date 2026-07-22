# LATENT

**Change one thing. Watch intelligence diverge.**

LATENT is a minimal interactive research instrument for observing how AI outputs diverge across parallel alternative realities. It is not a course platform, chat app, dashboard, or onboarding funnel. The first stage implements the **Model Divergence** scenario: start with one prompt, clone the run into multiple worlds, change one condition, stream responses side by side, inspect the divergence point, scrub the timeline, branch from an event, and save the experiment locally.

## Product concept

A user launches one AI process, creates up to four worlds, changes parameters such as temperature, seed, model, or system instruction, and watches responses stream in parallel. LATENT distinguishes:

- real provider data;
- computed text metrics;
- approximate text heuristics;
- unavailable information.

No hidden model state or causal attribution is invented.

## Current stage

Stage 1 ships a working local MVP:

- prompt entry and first world creation;
- up to four parallel worlds;
- mock streaming without API keys;
- OpenAI-compatible server adapter when environment variables are configured;
- local experiment state in Zustand;
- IndexedDB autosave with Dexie;
- JSON import/export;
- divergence metrics calculated in a Web Worker;
- compare view;
- global timeline with scrubber and event selection;
- branch creation from parent world or timeline event;
- Inputs & Conditions inspector;
- command palette and keyboard shortcuts.

## Architecture

The app uses Next.js App Router, React, strict TypeScript, Tailwind CSS, CSS variables, Zustand, TanStack Query provider setup, Zod, Framer Motion, Dexie, Web Workers, Vitest, and Playwright.

Feature-based layout:

```txt
src/app                         App Router pages and streaming API
src/entities                    Domain entity types
src/features/experiment         Store, persistence, workspace, entry flow
src/features/worlds             World UI and config diff services
src/features/divergence         Text metrics, worker, compare view
src/features/timeline           Global playback and scrubber UI
src/features/providers          Provider interface, mock, OpenAI-compatible adapter
src/shared                      UI primitives, tokens, config, utilities
```

Provider contract:

```ts
interface ModelProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  supports(configKey: ModelConfigKey): boolean;
  stream(request: GenerationRequest): AsyncIterable<ProviderStreamChunk>;
}
```

## Local setup

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Mock mode

Mock mode is the default and requires no external service. It is deterministic for a given prompt, system prompt, temperature, and seed. It streams meaningful scenario-based answers, changes behavior with temperature and system instructions, simulates latency, and returns simulated token usage.

## External provider setup

Set server-side environment variables. API keys are never sent to the browser and are not persisted.

```bash
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=...
AI_MODEL=gpt-4o-mini
```

If `AI_API_KEY` is missing, the server automatically falls back to `MockProvider`.

## Scripts

```bash
pnpm dev          # start development server
pnpm build        # production build
pnpm start        # start production server
pnpm lint         # Next.js lint
pnpm typecheck    # TypeScript strict check
pnpm test         # Vitest unit/integration tests
pnpm e2e          # Playwright critical path
```

## Testing

Unit coverage includes:

- experiment creation;
- root world creation;
- branch world creation;
- branch from timeline event;
- model config diff;
- divergence detection;
- Levenshtein normalization;
- Jaccard similarity;
- deterministic mock provider;
- serialization;
- IndexedDB persistence and migration layer;
- Zod import validation.

Playwright covers the critical user path: create experiment, run mock world, create a second reality, run all worlds, open compare, see divergence, save, reload, and restore.

## Data model

The local persisted bundle contains:

- `Experiment` metadata and world selection;
- `World` prompt, system prompt, model config, parent link, branch point;
- `Generation` streamed text, chunks, usage, latency, finish reason, errors;
- `TimelineEvent` records;
- `DivergenceReport` computed text metrics;
- local UI settings and schema version.

## Privacy

- MVP works locally without accounts.
- Experiments are stored in the browser's IndexedDB.
- JSON export is user-initiated.
- API keys are read only from server environment variables.
- API keys are not stored in IndexedDB or sent to the client.

## Known limitations

- Causal attribution is not implemented.
- Hidden model state is unavailable.
- Token-level data depends on the provider; mock token indexes are simulated and marked as such.
- Time-travel restores interface-visible events, but not the model's internal hidden state.
- Divergence metrics are text heuristics: common prefix, normalized Levenshtein distance, Jaccard lexical overlap, bigram overlap, and length comparison.
- The first stage supports up to four worlds and does not include auth, database, billing, RAG, embeddings, agents, or prompt-injection scenarios.

## Future stages

The architecture is prepared for additional research scenarios:

- Search Reality;
- Hallucination Trace;
- Prompt Injection Arena;
- Agent Failure;
- AI Systems Simulator;
- server persistence with PostgreSQL;
- user accounts and collaboration.
