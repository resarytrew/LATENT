import type { GenerationRequest, ModelDescriptor, ModelProvider, ProviderStreamChunk } from '@/features/providers/model/types';
import type { ModelConfigKey } from '@/entities/world/types';

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const scenarioLibrary = {
  sky: {
    stable: [
      'Blue sky is mainly a result of Rayleigh scattering.',
      'Sunlight contains many wavelengths; shorter blue wavelengths scatter more strongly in the atmosphere than red wavelengths.',
      'From the ground, scattered blue light reaches your eyes from many directions, so the dome of the sky appears blue.',
      'Near sunset, light travels through more air, much of the blue is scattered out of the direct path, and warmer colors become more visible.'
    ],
    speculative: [
      'The sky looks blue because the atmosphere acts like a selective diffuser.',
      'Tiny molecules redirect shorter wavelengths more often, so blue light is redistributed across the visible sky.',
      'The effect is not because the ocean reflects upward, and it is not because oxygen is literally blue at ordinary atmospheric density.',
      'Change the particle size or the path length and the color balance changes, which is why haze and sunsets look different.'
    ],
    terse: ['Rayleigh scattering makes shorter blue wavelengths spread through the atmosphere more than longer red wavelengths.', 'That scattered light arrives from all directions, producing a blue sky.']
  },
  city: {
    stable: [
      'A city without cars would need to be designed around proximity rather than traffic flow.',
      'Daily needs would sit within walking distance, while freight, emergency access, and mobility for disabled residents would use managed corridors.',
      'Streets could become civic rooms: shaded paths, quiet tram lines, repair kiosks, gardens, and places to pause.',
      'The main design risk is exclusion; the system must work for bad weather, late shifts, families, and people who cannot walk far.'
    ],
    speculative: [
      'Start with a rule: no destination should require owning a private vehicle.',
      'Housing, work, schools, clinics, and food distribution would form compact clusters connected by trams, cargo bikes, and small autonomous shuttles.',
      'Instead of parking lots, the scarce resource becomes curb access, delivery timing, and comfortable public space.',
      'The city succeeds only if logistics are invisible but accountable.'
    ],
    terse: ['Remove private cars by shortening distances first.', 'Then add reliable transit, accessible micro-mobility, freight windows, emergency lanes, and weather-protected public space.']
  },
  medical: {
    stable: [
      'AI should not independently make medical decisions that carry significant risk.',
      'It can help summarize records, surface possibilities, check interactions, and support clinicians, but accountability must remain with qualified humans and institutions.',
      'The reason is practical rather than mystical: medical data is incomplete, patients vary, and errors can be consequential.',
      'A safer role is decision support with audit trails, escalation paths, and clear limits.'
    ],
    speculative: [
      'The useful question is not whether AI decides, but where the final authority sits.',
      'For low-risk administrative tasks, automation may be acceptable; for diagnosis or treatment, AI should propose, explain evidence, and defer to clinical judgment.',
      'Patients also need disclosure when AI materially shapes a recommendation.',
      'Without oversight, the system can become efficient at being wrong.'
    ],
    terse: ['AI can assist medical decisions, but high-stakes decisions should remain human-accountable.', 'Use it for support, triage, checks, and documentation—not unsupervised authority.']
  },
  general: {
    stable: [
      'A careful answer starts by separating the observable facts from the assumptions.',
      'The central tradeoff is usually not a single variable; it is the interaction between constraints, incentives, and feedback.',
      'If one condition changes, the conclusion may still look similar at first, but the path of reasoning can diverge quickly.',
      'The most reliable approach is to state the baseline, vary one condition, and compare the consequences directly.'
    ],
    speculative: [
      'There are at least two plausible frames for the question.',
      'One treats the problem as a design constraint; another treats it as a behavioral system that adapts to pressure.',
      'Those frames may share the first few sentences, then diverge in what they optimize for: clarity, resilience, speed, or fairness.',
      'The answer depends on which failure mode you are most unwilling to accept.'
    ],
    terse: ['Define the baseline, change one condition, and watch which assumptions stop holding.', 'That comparison usually reveals more than a single static answer.']
  }
};

type ScenarioKey = keyof typeof scenarioLibrary;

function chooseScenario(prompt: string): ScenarioKey {
  const p = prompt.toLowerCase();
  if (p.includes('sky') || p.includes('blue')) return 'sky';
  if (p.includes('city') || p.includes('cars')) return 'city';
  if (p.includes('medical') || p.includes('doctor') || p.includes('medicine')) return 'medical';
  return 'general';
}

function styleFromSystemPrompt(systemPrompt: string): 'skeptical' | 'poetic' | 'strict' | 'neutral' {
  const s = systemPrompt.toLowerCase();
  if (s.includes('skeptic') || s.includes('challenge')) return 'skeptical';
  if (s.includes('poetic') || s.includes('metaphor')) return 'poetic';
  if (s.includes('strict') || s.includes('concise') || s.includes('precise')) return 'strict';
  return 'neutral';
}

function composeText(request: GenerationRequest): string {
  const { prompt, systemPrompt, modelConfig } = request;
  const scenario = scenarioLibrary[chooseScenario(prompt)];
  const seed = modelConfig.seed ?? hash(prompt);
  const rng = mulberry32(seed + hash(systemPrompt) + Math.round(modelConfig.temperature * 1000));
  const style = styleFromSystemPrompt(systemPrompt);
  const temperature = modelConfig.temperature;
  const branch = temperature < 0.25 ? 'terse' : temperature > 0.78 ? 'speculative' : rng() > 0.48 ? 'stable' : 'speculative';
  const base = [...scenario[branch]];

  if (style === 'skeptical') {
    base.splice(1, 0, 'A skeptical reading asks what evidence would falsify the answer, not only what makes it sound coherent.');
  }
  if (style === 'poetic') {
    base.splice(1, 0, 'Think of the system as a quiet instrument: the same input string vibrates differently when one constraint is tightened or loosened.');
  }
  if (style === 'strict') {
    base.unshift('Short answer:');
  }

  const exploratory = [
    'A useful experiment is to run the same request with a lower temperature, a higher temperature, and a changed system instruction.',
    'The repeated prefix shows where the model stayed anchored; the first different phrase marks where sampling or instructions began to matter.',
    'This is a text comparison only: it does not expose hidden model state or prove causal attribution.'
  ];

  if (temperature > 0.55 || style !== 'strict') {
    const extraIndex = Math.floor(rng() * exploratory.length);
    base.push(exploratory[extraIndex]);
  }

  const maxWords = Math.max(40, modelConfig.maxOutputTokens);
  return base.join(' ').split(/\s+/).slice(0, maxWords).join(' ');
}

export class MockProvider implements ModelProvider {
  id = 'mock';

  async listModels(): Promise<ModelDescriptor[]> {
    return [
      { id: 'latent-mock-reasoner', label: 'LATENT Mock Reasoner', provider: this.id, supportsSeed: true, contextWindow: 4096 },
      { id: 'latent-mock-compact', label: 'LATENT Mock Compact', provider: this.id, supportsSeed: true, contextWindow: 2048 }
    ];
  }

  supports(configKey: ModelConfigKey): boolean {
    return ['provider', 'model', 'temperature', 'topP', 'maxOutputTokens', 'seed', 'frequencyPenalty', 'presencePenalty'].includes(configKey);
  }

  async *stream(request: GenerationRequest): AsyncIterable<ProviderStreamChunk> {
    const text = composeText(request);
    const words = text.match(/\S+\s*/g) ?? [text];
    const seed = request.modelConfig.seed ?? hash(request.prompt);
    const rng = mulberry32(seed + 13);
    let emitted = 0;
    for (let i = 0; i < words.length; i += 2) {
      if (request.abortSignal?.aborted) {
        yield { source: 'simulated', finishReason: 'aborted' };
        return;
      }
      const chunk = `${words[i] ?? ''}${words[i + 1] ?? ''}`;
      emitted += chunk.trim().length > 0 ? chunk.trim().split(/\s+/).length : 0;
      if (process.env.NODE_ENV !== 'test') await sleep(45 + Math.floor(rng() * 95));
      yield { text: chunk, source: 'simulated', tokenIndex: emitted };
    }
    yield {
      source: 'simulated',
      finishReason: 'stop',
      usage: {
        promptTokens: Math.ceil((request.prompt.length + request.systemPrompt.length) / 4),
        completionTokens: emitted,
        totalTokens: Math.ceil((request.prompt.length + request.systemPrompt.length) / 4) + emitted,
        source: 'simulated'
      }
    };
  }
}

export const __mockInternals = { composeText, hash };
