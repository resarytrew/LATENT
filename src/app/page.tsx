"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Locale = "ru" | "en";
type Stance = "systems" | "civic" | "speculative" | "skeptic";
type ModelProfile = "balanced" | "precise" | "creative";
type ConditionKey = "temperature" | "seed" | "stance" | "profile" | "systemInstruction";
type MetricKey = "lexical" | "distance" | "length" | "structure" | "uncertainty";

type World = {
  id: number;
  temperature: number;
  seed: number;
  stance: Stance;
  profile: ModelProfile;
  systemInstruction: string;
  color: string;
  parentId?: number;
  changedKey?: ConditionKey;
};

type SavedExperiment = {
  id: string;
  prompt: string;
  worlds: World[];
  updatedAt: string;
  hypothesis?: string;
  metrics?: MetricKey[];
  annotations?: Annotation[];
  conclusion?: string;
  versions?: RunVersion[];
};

type Annotation = { id: string; worldId: number; quote: string; note: string };
type RunVersion = { id: string; createdAt: string; prompt: string; worlds: World[]; hypothesis: string; metrics: MetricKey[]; annotations: Annotation[]; conclusion: string };
type ResearchSnapshot = Pick<RunVersion, "hypothesis" | "metrics" | "annotations" | "conclusion">;

type Copy = Record<string, string>;

const copy: Record<Locale, Copy> = {
  ru: {
    scenario: "Сценарий 01", modelDivergence: "Расхождение моделей", saved: "Сохранено локально", unsaved: "Есть изменения",
    source: "Исходник ↗", input: "01 / ВВОД", motto: "Измените одно условие. Наблюдайте расхождение интеллекта.",
    promptLabel: "Промпт эксперимента", promptPlaceholder: "Что вы хотите исследовать?", onePrompt: "Один исходный промпт",
    mockProvider: "Локальная симуляция · без API-ключа", worlds: "параллельных мира", run: "Запустить все миры", running: "Генерация",
    newReality: "+ Новая реальность", ready: "Готов", streaming: "Поток", complete: "Завершено", temperature: "Температура",
    seed: "Seed", tokens: "токенов", inspect: "Сравнить ↗", noGeneration: "Запустите эксперимент, чтобы получить ответ.",
    trace: "02 / ТРАЕКТОРИЯ", timeline: "Общая временная шкала", openCompare: "Открыть сравнение", play: "Воспроизвести",
    pause: "Пауза", branchEvent: "Создать ветку из события", created: "Создано", started: "Генерация", changed: "Условие изменено",
    diverged: "Расхождение", completed: "Завершено", integrity: "Данные провайдера маркируются. Метрики вычисляются. Скрытое состояние модели не выдумывается.",
    local: "ЛОКАЛЬНЫЙ ЭКСПЕРИМЕНТ · V0.5", savedExperiments: "Сохранённые эксперименты", open: "Открыть", duplicate: "Дублировать",
    remove: "Удалить", export: "Экспорт JSON", import: "Импорт JSON", newExperiment: "Новый эксперимент", emptySaved: "Сохранённых экспериментов пока нет.",
    close: "Закрыть", createReality: "Создать новую реальность", branchFrom: "Ветка от", changeOnly: "Изменить только одно условие",
    condition: "Условие", stance: "Роль", create: "Создать реальность", cancel: "Отмена", maxWorlds: "Достигнут лимит: четыре мира.",
    compareReport: "Отчёт о сравнении", whereSplit: "Где разделились миры", leftWorld: "Первый мир", rightWorld: "Второй мир",
    lexical: "лексическое расхождение", commonPrefix: "общий префикс", editDistance: "норм. дистанция", lengthDelta: "разница длины",
    characters: "символов", shared: "Общая часть", interpretation: "Граница интерпретации",
    boundary: "Это текстовые эвристики, а не доступ к скрытым рассуждениям или причинной атрибуции.", returnExperiment: "Вернуться к эксперименту",
    world_systems: "Базовый мир", world_civic: "Гражданская оптика", world_speculative: "Свободная ветка", world_skeptic: "Контрфактический мир",
    stance_systems: "Системный аналитик", stance_civic: "Общественный проектировщик", stance_speculative: "Спекулятивный исследователь", stance_skeptic: "Критический рецензент",
    changed_temperature: "Температура", changed_seed: "Seed", changed_stance: "Роль", language: "Язык", saveLibrary: "Открыть библиотеку",
    imported: "Эксперимент импортирован", invalidFile: "Не удалось прочитать файл", branch: "Ветка", fromEvent: "из события",
    howItWorks: "Как это работает?", onboardingKicker: "Лаборатория поведения ИИ", onboardingTitle: "Один вопрос. Одно изменение. Видимое расхождение.",
    onboardingBody: "LATENT запускает один промпт в нескольких параллельных мирах. Вы меняете ровно одно условие и видите, где ответы перестают совпадать.",
    stepOne: "Один вопрос", stepOneBody: "Задайте исходный промпт, который хотите проверить.", stepTwo: "Одно изменение", stepTwoBody: "Клонируйте мир и измените temperature, seed или роль.",
    stepThree: "Сравнение", stepThreeBody: "Найдите точку расхождения и измерьте отличие ответов.", watchDemo: "Запустить демонстрацию", ownQuestion: "Начать со своего вопроса",
    demoRunning: "Демонстрация запущена: один промпт выполняется в трёх мирах с разными условиями.", demoReady: "Ответы готовы. Теперь откройте сравнение и посмотрите, где разделились миры.",
    compareNow: "Показать расхождение", changeCondition: "Изменить условие", hideHint: "Скрыть подсказку", demoPrompt: "Спроектируйте город без автомобилей.",
    profile: "Профиль модели", profile_balanced: "Сбалансированный", profile_precise: "Точный", profile_creative: "Творческий",
    systemInstruction: "System instruction", systemPlaceholder: "Например: отвечай как строгий научный рецензент", conditions: "Условия", editConditions: "Настроить мир",
    saveChanges: "Сохранить изменения", presets: "Готовые сценарии", preset_city: "Город без машин", preset_medical: "ИИ в медицине", preset_school: "Школа без оценок", preset_search: "Ошибки поиска",
    changed_profile: "Профиль", changed_systemInstruction: "System instruction", exportReport: "Экспорт отчёта", reportTitle: "Отчёт эксперимента LATENT",
    simulatedLocally: "Все ответы сгенерированы локальным детерминированным симулятором. Внешние модели не использовались.", reportExported: "Отчёт подготовлен",
    protocol: "00 / ИССЛЕДОВАТЕЛЬСКИЙ ПРОТОКОЛ", hypothesis: "Гипотеза", hypothesisPlaceholder: "Например: более высокая temperature даст менее практичный, но более оригинальный ответ.",
    metricSelection: "Критерии сравнения", metric_lexical: "Лексика", metric_distance: "Редакционная дистанция", metric_length: "Длина", metric_structure: "Структура", metric_uncertainty: "Неопределённость",
    metricHelp_lexical: "Доля различающихся словарных единиц.", metricHelp_distance: "Сколько символов нужно изменить, добавить или удалить.", metricHelp_length: "Разница в объёме ответов.",
    metricHelp_structure: "Различие количества абзацев и композиции.", metricHelp_uncertainty: "Разница в частоте слов неуверенности и оговорок.",
    matrix: "Матрица всех миров", matrixHint: "Нажмите на ячейку, чтобы открыть пару.", annotations: "Наблюдения и аннотации", addNote: "Добавить заметку", quote: "Фрагмент ответа",
    note: "Наблюдение", notePlaceholder: "Что важно в этом фрагменте?", addAnnotation: "Сохранить аннотацию", noAnnotations: "Выделите фрагмент ответа и добавьте наблюдение.",
    conclusion: "Итоговый вывод", conclusionPlaceholder: "Подтвердилась ли гипотеза? Какое условие повлияло на результат?", saveResearch: "Сохранить протокол",
    metricGuide: "Как считаются метрики", versions: "версий", version: "Версия", openVersion: "Открыть версию", currentMetric: "Метрика матрицы",
  },
  en: {
    scenario: "Scenario 01", modelDivergence: "Model divergence", saved: "Saved locally", unsaved: "Unsaved changes",
    source: "Source ↗", input: "01 / INPUT", motto: "Change one thing. Watch intelligence diverge.",
    promptLabel: "Experiment prompt", promptPlaceholder: "What do you want to investigate?", onePrompt: "One source prompt",
    mockProvider: "Local simulation · no API key", worlds: "parallel worlds", run: "Run all worlds", running: "Running",
    newReality: "+ New reality", ready: "Ready", streaming: "Streaming", complete: "Complete", temperature: "Temperature",
    seed: "Seed", tokens: "tokens", inspect: "Compare ↗", noGeneration: "Run the experiment to generate a response.",
    trace: "02 / TRACE", timeline: "Global timeline", openCompare: "Open comparison", play: "Play", pause: "Pause",
    branchEvent: "Branch from event", created: "Created", started: "Generation", changed: "Condition changed", diverged: "Divergence", completed: "Completed",
    integrity: "Provider data is labelled. Metrics are computed. Hidden model state is never invented.", local: "LOCAL EXPERIMENT · V0.5",
    savedExperiments: "Saved experiments", open: "Open", duplicate: "Duplicate", remove: "Delete", export: "Export JSON", import: "Import JSON",
    newExperiment: "New experiment", emptySaved: "No saved experiments yet.", close: "Close", createReality: "Create a new reality",
    branchFrom: "Branch from", changeOnly: "Change exactly one condition", condition: "Condition", stance: "Role", create: "Create reality",
    cancel: "Cancel", maxWorlds: "Limit reached: four worlds.", compareReport: "Comparison report", whereSplit: "Where the worlds split",
    leftWorld: "First world", rightWorld: "Second world", lexical: "lexical divergence", commonPrefix: "common prefix", editDistance: "norm. distance",
    lengthDelta: "length delta", characters: "characters", shared: "Shared section", interpretation: "Interpretation boundary",
    boundary: "These are text heuristics, not access to hidden reasoning or causal attribution.", returnExperiment: "Return to experiment",
    world_systems: "Baseline", world_civic: "Civic lens", world_speculative: "Wild card", world_skeptic: "Counterfactual",
    stance_systems: "Systems analyst", stance_civic: "Public-interest designer", stance_speculative: "Speculative researcher", stance_skeptic: "Critical reviewer",
    changed_temperature: "Temperature", changed_seed: "Seed", changed_stance: "Role", language: "Language", saveLibrary: "Open library",
    imported: "Experiment imported", invalidFile: "Could not read the file", branch: "Branch", fromEvent: "from event",
    howItWorks: "How does it work?", onboardingKicker: "AI behaviour laboratory", onboardingTitle: "One question. One change. Visible divergence.",
    onboardingBody: "LATENT runs one prompt across parallel worlds. Change exactly one condition and see where the responses stop matching.",
    stepOne: "One question", stepOneBody: "Enter the source prompt you want to investigate.", stepTwo: "One change", stepTwoBody: "Clone a world and change temperature, seed or role.",
    stepThree: "Compare", stepThreeBody: "Locate the divergence point and measure the difference.", watchDemo: "Run the demonstration", ownQuestion: "Start with my own question",
    demoRunning: "The demonstration is running: one prompt is executing in three worlds with different conditions.", demoReady: "The responses are ready. Open comparison to see where the worlds split.",
    compareNow: "Show divergence", changeCondition: "Change a condition", hideHint: "Hide hint", demoPrompt: "Design a city without cars.",
    profile: "Model profile", profile_balanced: "Balanced", profile_precise: "Precise", profile_creative: "Creative",
    systemInstruction: "System instruction", systemPlaceholder: "For example: respond as a strict scientific reviewer", conditions: "Conditions", editConditions: "Configure world",
    saveChanges: "Save changes", presets: "Scenario presets", preset_city: "Car-free city", preset_medical: "AI in medicine", preset_school: "School without grades", preset_search: "Search failures",
    changed_profile: "Profile", changed_systemInstruction: "System instruction", exportReport: "Export report", reportTitle: "LATENT experiment report",
    simulatedLocally: "All responses were generated by the local deterministic simulator. No external models were used.", reportExported: "Report prepared",
    protocol: "00 / RESEARCH PROTOCOL", hypothesis: "Hypothesis", hypothesisPlaceholder: "For example: higher temperature will produce a less practical but more original response.",
    metricSelection: "Comparison criteria", metric_lexical: "Lexical", metric_distance: "Edit distance", metric_length: "Length", metric_structure: "Structure", metric_uncertainty: "Uncertainty",
    metricHelp_lexical: "Share of differing lexical units.", metricHelp_distance: "How many characters must be changed, added or removed.", metricHelp_length: "Difference in response volume.",
    metricHelp_structure: "Difference in paragraph count and composition.", metricHelp_uncertainty: "Difference in the frequency of uncertainty terms and caveats.",
    matrix: "All-world matrix", matrixHint: "Select a cell to open that pair.", annotations: "Observations and annotations", addNote: "Add note", quote: "Response excerpt",
    note: "Observation", notePlaceholder: "What matters in this excerpt?", addAnnotation: "Save annotation", noAnnotations: "Select a response excerpt and add an observation.",
    conclusion: "Final conclusion", conclusionPlaceholder: "Was the hypothesis supported? Which condition affected the result?", saveResearch: "Save protocol",
    metricGuide: "How metrics are calculated", versions: "versions", version: "Version", openVersion: "Open version", currentMetric: "Matrix metric",
  },
};

const colors = ["#ff4d00", "#16836d", "#6d5bd0", "#315dc4"];
const initialWorlds: World[] = [
  { id: 1, temperature: 0.2, seed: 1482, stance: "systems", profile: "precise", systemInstruction: "", color: colors[0] },
  { id: 2, temperature: 0.7, seed: 1482, stance: "civic", profile: "balanced", systemInstruction: "", color: colors[1], parentId: 1, changedKey: "stance" },
  { id: 3, temperature: 1.1, seed: 9071, stance: "speculative", profile: "creative", systemInstruction: "", color: colors[2], parentId: 1, changedKey: "temperature" },
];

const presetIds = ["city", "medical", "school", "search"] as const;
type PresetId = typeof presetIds[number];
const metricIds: MetricKey[] = ["lexical", "distance", "length", "structure", "uncertainty"];

function getPresetPrompt(id: PresetId, locale: Locale) {
  const prompts: Record<Locale, Record<PresetId, string>> = {
    ru: { city: "Спроектируйте город без автомобилей.", medical: "Должен ли ИИ принимать медицинские решения?", school: "Спроектируйте школу без оценок.", search: "Как поисковый ИИ должен отвечать, когда надёжных данных недостаточно?" },
    en: { city: "Design a city without cars.", medical: "Should AI make medical decisions?", school: "Design a school without grades.", search: "How should a search AI respond when reliable evidence is insufficient?" },
  };
  return prompts[locale][id];
}

function normalizeWorlds(worlds: World[]) {
  return worlds.map((world) => ({ ...world, profile: world.profile ?? "balanced", systemInstruction: world.systemInstruction ?? "" }));
}

const timelineEvents = [
  { point: 2, label: "created" }, { point: 19, label: "started" }, { point: 43, label: "changed" },
  { point: 64, label: "diverged" }, { point: 100, label: "completed" },
] as const;

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function choose(values: string[], key: string) {
  return values[hash(key) % values.length];
}

function worldResponse(world: World, prompt: string, locale: Locale) {
  const cleanPrompt = prompt.trim() || (locale === "ru" ? "Спроектируйте город без автомобилей." : "Design a city without cars.");
  const profile = world.profile ?? "balanced";
  const instruction = (world.systemInstruction ?? "").trim();
  const key = `${cleanPrompt}|${world.seed}|${world.temperature}|${world.stance}|${profile}|${instruction}|${locale}`;
  const temperatureBand = world.temperature < 0.45 ? "low" : world.temperature > 0.9 ? "high" : "mid";

  if (locale === "ru") {
    const openings: Record<Stance, string[]> = {
      systems: ["Начнём со структуры ограничений.", "Сначала определим систему, а не отдельное решение."],
      civic: ["Сначала посмотрим, кому принадлежит выгода.", "Эта задача начинается с равного доступа."],
      speculative: ["Представим, что привычные правила больше не обязательны.", "Полезно начать с радикально иной нормы."],
      skeptic: ["Начнём с самого сильного возражения.", "Сначала проверим, где решение может сломаться."],
    };
    const bodies: Record<Stance, string[]> = {
      systems: [
        `Задачу «${cleanPrompt}» стоит разложить на потоки, ресурсы, ограничения и обратные связи. Сначала создаётся минимальная работающая сеть, затем её качество измеряется по времени, доступности и устойчивости.`,
        `Для «${cleanPrompt}» нужен поэтапный план: карта зависимостей, пилотный контур, наблюдаемые метрики и механизм корректировки. Решение должно улучшать систему до того, как исчезнет прежняя опора.`,
      ],
      civic: [
        `В вопросе «${cleanPrompt}» ключевой критерий — не средняя эффективность, а доступ для людей с разными возможностями. Решение следует проверять на детях, пожилых, ночных работниках и тех, кто живёт дальше от центра.`,
        `«${cleanPrompt}» становится убедительным только тогда, когда выгода распределена справедливо. Участники должны влиять на правила, а базовый доступ не может зависеть от дохода или цифровой грамотности.`,
      ],
      speculative: [
        `Если принять «${cleanPrompt}» как новую исходную реальность, освобождается пространство для неожиданных ритуалов, сервисов и форм сотрудничества. Инфраструктура может менять назначение по времени суток и реагировать на контекст.`,
        `Вместо оптимизации прошлого «${cleanPrompt}» предлагает построить новый язык поведения. Пусть система будет модульной, обратимой и способной превращать ограничение в культурное преимущество.`,
      ],
      skeptic: [
        `Для «${cleanPrompt}» нельзя проектировать только удобный средний сценарий. Нужно проверить крайние случаи, стоимость перехода, отказоустойчивость и тех, чья свобода может сократиться.`,
        `Главный риск идеи «${cleanPrompt}» — выдать красивое ограничение за универсальное благо. Сначала альтернатива должна превзойти старую систему в самых трудных сценариях.`,
      ],
    };
    const conclusions = temperatureBand === "low"
      ? ["Следующий шаг — один измеримый пилот и заранее определённый критерий успеха.", "Решение следует проверять небольшим обратимым экспериментом."]
      : temperatureBand === "high"
        ? ["Сильный тест: сможет ли ограничение породить больше свободы, чем оно забирает?", "Неожиданный критерий успеха — появление поведения, которое раньше было невозможно."]
        : ["Следующий шаг — сравнить два сценария на одинаковом наборе метрик.", "Лучший переход сочетает измеримость, участие и возможность отката."];
    const profileEffects: Record<ModelProfile, string[]> = {
      balanced: ["Балансируем практичность, ясность и возможные побочные эффекты.", "Вывод соединяет реализуемость с проверкой рисков."],
      precise: ["Критерии проверки: доступность, стоимость перехода и обратимость решения.", "Проверка должна фиксировать исходные условия, метрику и порог успеха."],
      creative: ["Дополнительный ход: представить противоположное решение и найти между ними третью возможность.", "Полезно проверить идею через необычный контрфактический сценарий."],
    };
    const instructionEffect = instruction ? `\n\nДополнительный фокус из system instruction: «${instruction.slice(0, 180)}».` : "";
    return `${choose(openings[world.stance], `${key}|open`)}\n\n${choose(bodies[world.stance], `${key}|body`)}\n\n${choose(conclusions, `${key}|close`)}\n\n${choose(profileEffects[profile], `${key}|profile`)}${instructionEffect}`;
  }

  const openings: Record<Stance, string[]> = {
    systems: ["Start with the constraint system.", "Define the system before choosing a solution."],
    civic: ["Begin with who receives the benefit.", "This problem starts with equal access."],
    speculative: ["Imagine the old rules are no longer mandatory.", "Begin from a radically different default."],
    skeptic: ["Start with the strongest objection.", "First locate where the idea could fail."],
  };
  const bodies: Record<Stance, string[]> = {
    systems: [`Treat “${cleanPrompt}” as a network of flows, resources, constraints and feedback loops. Build the smallest viable system first, then measure time, access and resilience before expanding it.`, `For “${cleanPrompt}”, map dependencies, establish a pilot, define observable metrics and create a correction loop. Improve the replacement before removing the old support.`],
    civic: [`For “${cleanPrompt}”, average efficiency is not enough. Test access for children, older people, night workers and residents far from the centre.`, `“${cleanPrompt}” works only when benefits are distributed fairly. People need influence over the rules, and basic access cannot depend on income or digital fluency.`],
    speculative: [`Accept “${cleanPrompt}” as a new reality and unexpected rituals, services and forms of cooperation become possible. Infrastructure can change purpose throughout the day.`, `Instead of optimising the past, “${cleanPrompt}” can establish a new behavioural language: modular, reversible and able to turn constraint into cultural advantage.`],
    skeptic: [`Do not design “${cleanPrompt}” around the convenient average case. Test edge cases, transition cost, resilience and the people whose freedom may shrink.`, `The central risk in “${cleanPrompt}” is presenting an elegant constraint as a universal benefit. The alternative must first win in the hardest scenarios.`],
  };
  const conclusions = temperatureBand === "low"
    ? ["Next: run one measurable pilot with a predefined success criterion.", "Validate the idea through a small reversible experiment."]
    : temperatureBand === "high"
      ? ["The strongest test: can the constraint create more freedom than it removes?", "An unexpected success metric is behaviour that was previously impossible."]
      : ["Next, compare two scenarios against the same metrics.", "The best transition combines measurement, participation and reversibility."];
  const profileEffects: Record<ModelProfile, string[]> = {
    balanced: ["Balance practical value, clarity and possible side effects.", "The conclusion combines feasibility with a risk check."],
    precise: ["Validation criteria: access, transition cost and reversibility.", "The test must record initial conditions, a metric and a success threshold."],
    creative: ["Additional move: imagine the opposite solution and locate a third possibility between them.", "Test the idea through an unusual counterfactual scenario."],
  };
  const instructionEffect = instruction ? `\n\nAdditional focus from the system instruction: “${instruction.slice(0, 180)}”.` : "";
  return `${choose(openings[world.stance], `${key}|open`)}\n\n${choose(bodies[world.stance], `${key}|body`)}\n\n${choose(conclusions, `${key}|close`)}\n\n${choose(profileEffects[profile], `${key}|profile`)}${instructionEffect}`;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function commonPrefix(left: string, right: string) {
  let index = 0;
  while (index < left.length && index < right.length && left[index] === right[index]) index += 1;
  return index;
}

function lexicalSimilarity(leftText: string, rightText: string) {
  const left = new Set(leftText.toLowerCase().match(/[a-zа-яё]+/g) ?? []);
  const right = new Set(rightText.toLowerCase().match(/[a-zа-яё]+/g) ?? []);
  const shared = [...left].filter((word) => right.has(word)).length;
  return shared / Math.max(1, new Set([...left, ...right]).size);
}

function normalizedDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(current[column - 1] + 1, previous[column] + 1, previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1));
    }
    for (let column = 0; column <= right.length; column += 1) previous[column] = current[column];
  }
  return previous[right.length] / Math.max(1, left.length, right.length);
}

function structureDifference(left: string, right: string) {
  const leftParts = left.split(/\n\s*\n/).filter(Boolean).length;
  const rightParts = right.split(/\n\s*\n/).filter(Boolean).length;
  return Math.round((Math.abs(leftParts - rightParts) / Math.max(1, leftParts, rightParts)) * 100);
}

function uncertaintyScore(text: string, locale: Locale) {
  const terms = locale === "ru" ? ["возможно", "может", "вероятно", "риск", "нельзя", "если"] : ["may", "might", "possibly", "risk", "cannot", "if"];
  const lower = text.toLowerCase();
  return terms.reduce((total, term) => total + (lower.match(new RegExp(term, "g"))?.length ?? 0), 0);
}

function metricDifference(metric: MetricKey, left: string, right: string, locale: Locale) {
  if (metric === "lexical") return Math.round((1 - lexicalSimilarity(left, right)) * 100);
  if (metric === "distance") return Math.round(normalizedDistance(left, right) * 100);
  if (metric === "length") return Math.round((Math.abs(left.length - right.length) / Math.max(1, left.length, right.length)) * 100);
  if (metric === "structure") return structureDifference(left, right);
  return Math.min(100, Math.abs(uncertaintyScore(left, locale) - uncertaintyScore(right, locale)) * 12);
}

function getWorldName(world: World, locale: Locale, t: Copy) {
  return t[`world_${world.stance}`] ?? `${t.branch} ${world.id}`;
}

function getConditionValue(world: World, t: Copy) {
  if (world.changedKey === "temperature") return world.temperature.toFixed(1);
  if (world.changedKey === "seed") return String(world.seed);
  if (world.changedKey === "stance") return t[`stance_${world.stance}`];
  if (world.changedKey === "profile") return t[`profile_${world.profile}`];
  if (world.changedKey === "systemInstruction") return world.systemInstruction || "—";
  return "—";
}

export default function Home() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [experimentId, setExperimentId] = useState(() => `exp-${Date.now()}`);
  const [prompt, setPrompt] = useState("Спроектируйте город без автомобилей.");
  const [worlds, setWorlds] = useState<World[]>(initialWorlds);
  const [progress, setProgress] = useState(0);
  const [scrub, setScrub] = useState(0);
  const [running, setRunning] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeWorld, setActiveWorld] = useState(1);
  const [compareOpen, setCompareOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [realityOpen, setRealityOpen] = useState(false);
  const [inspectorWorldId, setInspectorWorldId] = useState<number | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(true);
  const [demoCoach, setDemoCoach] = useState(false);
  const [hypothesis, setHypothesis] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["lexical", "distance", "structure"]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [conclusion, setConclusion] = useState("");
  const [annotationWorldId, setAnnotationWorldId] = useState<number | null>(null);
  const [draftQuote, setDraftQuote] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [matrixMetric, setMatrixMetric] = useState<MetricKey>("lexical");
  const [saved, setSaved] = useState(false);
  const [experiments, setExperiments] = useState<SavedExperiment[]>([]);
  const [notice, setNotice] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(0);
  const [compareLeft, setCompareLeft] = useState(1);
  const [compareRight, setCompareRight] = useState(2);
  const [draftBase, setDraftBase] = useState(1);
  const [draftCondition, setDraftCondition] = useState<ConditionKey>("temperature");
  const [draftTemperature, setDraftTemperature] = useState(0.8);
  const [draftSeed, setDraftSeed] = useState(7777);
  const [draftStance, setDraftStance] = useState<Stance>("skeptic");
  const [draftProfile, setDraftProfile] = useState<ModelProfile>("creative");
  const [draftSystemInstruction, setDraftSystemInstruction] = useState("");
  const generationTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const t = copy[locale];

  useEffect(() => {
    if (window.localStorage.getItem("latent-onboarding-seen-v1") === "1") setOnboardingOpen(false);
    const storedLocale = window.localStorage.getItem("latent-locale") as Locale | null;
    if (storedLocale === "ru" || storedLocale === "en") setLocale(storedLocale);
    try {
      const stored = JSON.parse(window.localStorage.getItem("latent-experiments-v2") ?? "[]") as SavedExperiment[];
      setExperiments(Array.isArray(stored) ? stored.map((item) => ({
        ...item,
        worlds: normalizeWorlds(item.worlds),
        versions: item.versions?.map((version) => ({
          ...version,
          worlds: normalizeWorlds(version.worlds),
          metrics: version.metrics?.length ? version.metrics : ["lexical", "distance", "structure"],
          annotations: version.annotations ?? [],
          hypothesis: version.hypothesis ?? "",
          conclusion: version.conclusion ?? "",
        })),
      })) : []);
    } catch {
      window.localStorage.removeItem("latent-experiments-v2");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem("latent-locale", locale);
  }, [locale]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCompareOpen(false); setLibraryOpen(false); setRealityOpen(false); setInspectorWorldId(null); setAnnotationWorldId(null); setOnboardingOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  useEffect(() => () => {
    if (generationTimer.current) clearInterval(generationTimer.current);
    if (playbackTimer.current) clearInterval(playbackTimer.current);
  }, []);

  const responses = useMemo(() => worlds.map((world) => worldResponse(world, prompt, locale)), [worlds, prompt, locale]);
  const leftIndex = Math.max(0, worlds.findIndex((world) => world.id === compareLeft));
  const rightIndex = Math.max(0, worlds.findIndex((world) => world.id === compareRight));
  const leftResponse = responses[leftIndex] ?? "";
  const rightResponse = responses[rightIndex] ?? "";
  const comparison = useMemo(() => ({
    prefix: commonPrefix(leftResponse, rightResponse),
    lexical: Math.round((1 - lexicalSimilarity(leftResponse, rightResponse)) * 100),
    distance: Math.round(normalizedDistance(leftResponse, rightResponse) * 100),
    length: Math.abs(leftResponse.length - rightResponse.length),
  }), [leftResponse, rightResponse]);
  const inspectorWorld = inspectorWorldId === null ? undefined : worlds.find((world) => world.id === inspectorWorldId);
  const annotationWorld = annotationWorldId === null ? undefined : worlds.find((world) => world.id === annotationWorldId);

  function markDirty() { setSaved(false); setProgress(0); setScrub(0); }
  function markResearchDirty() { setSaved(false); }

  function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    markDirty();
  }

  function saveCurrent(nextPrompt = prompt, nextWorlds = worlds, nextId = experimentId, research: ResearchSnapshot = { hypothesis, metrics: selectedMetrics, annotations, conclusion }) {
    const now = new Date().toISOString();
    const version: RunVersion = { id: `run-${Date.now()}`, createdAt: now, prompt: nextPrompt, worlds: nextWorlds, ...research };
    setExperiments((current) => {
      const existing = current.find((item) => item.id === nextId);
      const snapshot: SavedExperiment = { id: nextId, prompt: nextPrompt, worlds: nextWorlds, updatedAt: now, ...research, versions: [version, ...(existing?.versions ?? [])].slice(0, 30) };
      const next = [snapshot, ...current.filter((item) => item.id !== nextId)].slice(0, 20);
      window.localStorage.setItem("latent-experiments-v2", JSON.stringify(next));
      return next;
    });
    setSaved(true);
  }

  function saveResearch() {
    const now = new Date().toISOString();
    setExperiments((current) => {
      const existing = current.find((item) => item.id === experimentId);
      const versions = existing?.versions ? [...existing.versions] : [];
      if (versions[0]) versions[0] = { ...versions[0], hypothesis, metrics: selectedMetrics, annotations, conclusion };
      const snapshot: SavedExperiment = { id: experimentId, prompt, worlds, updatedAt: now, hypothesis, metrics: selectedMetrics, annotations, conclusion, versions };
      const next = [snapshot, ...current.filter((item) => item.id !== experimentId)].slice(0, 20);
      window.localStorage.setItem("latent-experiments-v2", JSON.stringify(next));
      return next;
    });
    setSaved(true);
  }

  function startRun(nextPrompt: string, nextWorlds: World[], nextId = experimentId, research?: ResearchSnapshot) {
    if (generationTimer.current) clearInterval(generationTimer.current);
    if (playbackTimer.current) clearInterval(playbackTimer.current);
    setPlaying(false); setRunning(true); setSaved(false); setProgress(3); setScrub(3); setSelectedEvent(1);
    generationTimer.current = setInterval(() => {
      setProgress((value) => {
        const next = Math.min(100, value + 5);
        setScrub(next);
        if (next >= 42) setSelectedEvent(2);
        if (next >= 64) setSelectedEvent(3);
        if (next === 100) {
          if (generationTimer.current) clearInterval(generationTimer.current);
          setRunning(false); setSelectedEvent(4); window.setTimeout(() => saveCurrent(nextPrompt, nextWorlds, nextId, research), 0);
        }
        return next;
      });
    }, 95);
  }

  function runAll() { startRun(prompt, worlds); }

  function dismissOnboarding() {
    setOnboardingOpen(false);
    window.localStorage.setItem("latent-onboarding-seen-v1", "1");
  }

  function startExample() {
    const nextId = `exp-${Date.now()}`;
    const examplePrompt = t.demoPrompt;
    const exampleResearch: ResearchSnapshot = {
      hypothesis: locale === "ru" ? "Более свободные условия дадут более оригинальный, но менее практичный ответ." : "Looser conditions will produce a more original but less practical response.",
      metrics: ["lexical", "distance", "structure"],
      annotations: [],
      conclusion: "",
    };
    setExperimentId(nextId); setPrompt(examplePrompt); setWorlds(initialWorlds); setActiveWorld(1); setCompareLeft(1); setCompareRight(2);
    setHypothesis(exampleResearch.hypothesis); setSelectedMetrics(exampleResearch.metrics); setAnnotations([]); setConclusion("");
    setDemoCoach(true); dismissOnboarding();
    window.setTimeout(() => startRun(examplePrompt, initialWorlds, nextId, exampleResearch), 80);
  }

  function startOwnQuestion() {
    dismissOnboarding();
    window.setTimeout(() => promptRef.current?.focus(), 80);
  }

  function togglePlayback() {
    if (playing) {
      if (playbackTimer.current) clearInterval(playbackTimer.current);
      setPlaying(false); return;
    }
    if (playbackTimer.current) clearInterval(playbackTimer.current);
    setPlaying(true);
    if (scrub >= 100) setScrub(0);
    playbackTimer.current = setInterval(() => {
      setScrub((value) => {
        const next = Math.min(100, value + 2);
        if (next === 100) { if (playbackTimer.current) clearInterval(playbackTimer.current); setPlaying(false); }
        return next;
      });
    }, 45);
  }

  function openReality(baseId = activeWorld) {
    if (worlds.length >= 4) { setNotice(t.maxWorlds); window.setTimeout(() => setNotice(""), 2600); return; }
    const base = worlds.find((world) => world.id === baseId) ?? worlds[0];
    setDraftBase(base.id); setDraftTemperature(Math.min(1.4, Number((base.temperature + 0.3).toFixed(1))));
    setDraftSeed(base.seed + 101); setDraftStance(base.stance === "skeptic" ? "systems" : "skeptic");
    setDraftProfile(base.profile === "creative" ? "precise" : "creative"); setDraftSystemInstruction(base.systemInstruction || ""); setRealityOpen(true);
  }

  function createReality() {
    const base = worlds.find((world) => world.id === draftBase) ?? worlds[0];
    const id = Math.max(...worlds.map((world) => world.id)) + 1;
    const next: World = { ...base, id, parentId: base.id, changedKey: draftCondition, color: colors[(id - 1) % colors.length] };
    if (draftCondition === "temperature") next.temperature = draftTemperature;
    if (draftCondition === "seed") next.seed = draftSeed;
    if (draftCondition === "stance") next.stance = draftStance;
    if (draftCondition === "profile") next.profile = draftProfile;
    if (draftCondition === "systemInstruction") next.systemInstruction = draftSystemInstruction.trim();
    setWorlds((current) => [...current, next]); setActiveWorld(id); setCompareRight(id); setRealityOpen(false); markDirty();
  }

  function updateTemperature(id: number, temperature: number) {
    setWorlds((current) => current.map((world) => world.id === id ? { ...world, temperature, changedKey: world.parentId ? "temperature" : world.changedKey } : world));
    markDirty();
  }

  function updateWorld(id: number, patch: Partial<World>, changedKey?: ConditionKey) {
    setWorlds((current) => current.map((world) => world.id === id ? { ...world, ...patch, changedKey: world.parentId && changedKey ? changedKey : world.changedKey } : world));
    markDirty();
  }

  function toggleMetric(metric: MetricKey) {
    setSelectedMetrics((current) => {
      if (!current.includes(metric)) return [...current, metric];
      if (current.length === 1) return current;
      const next = current.filter((item) => item !== metric);
      if (matrixMetric === metric) setMatrixMetric(next[0]);
      return next;
    });
    markResearchDirty();
  }

  function openAnnotation(worldId: number) {
    const selection = window.getSelection()?.toString().trim() ?? "";
    setDraftQuote(selection.slice(0, 500)); setDraftNote(""); setAnnotationWorldId(worldId);
  }

  function addAnnotation() {
    if (!annotationWorld || !draftNote.trim()) return;
    setAnnotations((current) => [...current, { id: `note-${Date.now()}`, worldId: annotationWorld.id, quote: draftQuote.trim(), note: draftNote.trim() }]);
    setAnnotationWorldId(null); markResearchDirty();
  }

  function removeAnnotation(id: string) {
    setAnnotations((current) => current.filter((item) => item.id !== id)); markResearchDirty();
  }

  function applyPreset(id: PresetId) {
    const presetPrompt = getPresetPrompt(id, locale);
    const salt = hash(id) % 9000;
    const nextWorlds = initialWorlds.map((world, index) => ({ ...world, seed: 1100 + salt + index * 137, systemInstruction: "" }));
    setExperimentId(`exp-${Date.now()}`); setPrompt(presetPrompt); setWorlds(nextWorlds); setActiveWorld(1); setCompareLeft(1); setCompareRight(2);
    setHypothesis(""); setSelectedMetrics(["lexical", "distance", "structure"]); setAnnotations([]); setConclusion("");
    setProgress(0); setScrub(0); setSaved(false); setDemoCoach(false);
  }

  function openSaved(experiment: SavedExperiment) {
    const normalized = normalizeWorlds(experiment.worlds);
    setExperimentId(experiment.id); setPrompt(experiment.prompt); setWorlds(normalized); setActiveWorld(normalized[0]?.id ?? 1);
    setCompareLeft(normalized[0]?.id ?? 1); setCompareRight(normalized[1]?.id ?? normalized[0]?.id ?? 1);
    setHypothesis(experiment.hypothesis ?? ""); setSelectedMetrics(experiment.metrics?.length ? experiment.metrics : ["lexical", "distance", "structure"]);
    setAnnotations(experiment.annotations ?? []); setConclusion(experiment.conclusion ?? "");
    setProgress(100); setScrub(100); setSaved(true); setLibraryOpen(false);
  }

  function openVersion(experimentIdToOpen: string, version: RunVersion) {
    const normalized = normalizeWorlds(version.worlds);
    setExperimentId(experimentIdToOpen); setPrompt(version.prompt); setWorlds(normalized); setActiveWorld(normalized[0]?.id ?? 1);
    setCompareLeft(normalized[0]?.id ?? 1); setCompareRight(normalized[1]?.id ?? normalized[0]?.id ?? 1);
    setHypothesis(version.hypothesis ?? ""); setSelectedMetrics(version.metrics?.length ? version.metrics : ["lexical", "distance", "structure"]);
    setAnnotations(version.annotations ?? []); setConclusion(version.conclusion ?? "");
    setProgress(100); setScrub(100); setSaved(true); setLibraryOpen(false);
  }

  function duplicateSaved(experiment: SavedExperiment) {
    const duplicated = { ...experiment, id: `exp-${Date.now()}`, prompt: `${experiment.prompt} — ${locale === "ru" ? "копия" : "copy"}`, updatedAt: new Date().toISOString() };
    const next = [duplicated, ...experiments]; setExperiments(next); window.localStorage.setItem("latent-experiments-v2", JSON.stringify(next));
  }

  function removeSaved(id: string) {
    const next = experiments.filter((experiment) => experiment.id !== id); setExperiments(next); window.localStorage.setItem("latent-experiments-v2", JSON.stringify(next));
  }

  function newExperiment() {
    const root = initialWorlds.slice(0, 1); setExperimentId(`exp-${Date.now()}`); setPrompt(""); setWorlds(root); setActiveWorld(1);
    setCompareLeft(1); setCompareRight(1); setHypothesis(""); setSelectedMetrics(["lexical", "distance", "structure"]); setAnnotations([]); setConclusion("");
    setProgress(0); setScrub(0); setSaved(false); setLibraryOpen(false);
  }

  function exportJson() {
    const existing = experiments.find((item) => item.id === experimentId);
    const data: SavedExperiment = { id: experimentId, prompt, worlds, updatedAt: new Date().toISOString(), hypothesis, metrics: selectedMetrics, annotations, conclusion, versions: existing?.versions ?? [] };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `latent-${experimentId}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  async function importJson(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as SavedExperiment;
      if (!parsed.prompt || !Array.isArray(parsed.worlds)) throw new Error("invalid");
      const imported = { ...parsed, worlds: normalizeWorlds(parsed.worlds), id: parsed.id || `exp-${Date.now()}`, updatedAt: new Date().toISOString() };
      const next = [imported, ...experiments.filter((item) => item.id !== imported.id)]; setExperiments(next);
      window.localStorage.setItem("latent-experiments-v2", JSON.stringify(next)); setNotice(t.imported); window.setTimeout(() => setNotice(""), 2400);
    } catch { setNotice(t.invalidFile); window.setTimeout(() => setNotice(""), 2400); }
  }

  function exportReport() {
    const baseline = responses[0] ?? "";
    const rows = worlds.map((world, index) => {
      const response = responses[index] ?? "";
      const divergence = index === 0 ? 0 : Math.round((1 - lexicalSimilarity(baseline, response)) * 100);
      return `<section><h2>0${world.id} — ${escapeHtml(getWorldName(world, locale, t))}</h2><dl><div><dt>${escapeHtml(t.profile)}</dt><dd>${escapeHtml(t[`profile_${world.profile}`])}</dd></div><div><dt>${escapeHtml(t.temperature)}</dt><dd>${world.temperature.toFixed(1)}</dd></div><div><dt>${escapeHtml(t.seed)}</dt><dd>${world.seed}</dd></div><div><dt>${escapeHtml(t.lexical)}</dt><dd>${divergence}%</dd></div></dl><h3>${escapeHtml(t.systemInstruction)}</h3><p class="instruction">${escapeHtml(world.systemInstruction || "—")}</p><h3>${escapeHtml(t.complete)}</h3><p class="response">${escapeHtml(response).replaceAll("\n", "<br>")}</p></section>`;
    }).join("");
    const metricsTable = selectedMetrics.map((metric) => `<tr><th>${escapeHtml(t[`metric_${metric}`])}</th>${responses.map((response, index) => `<td>${index === 0 ? "—" : `${metricDifference(metric, baseline, response, locale)}%`}</td>`).join("")}</tr>`).join("");
    const notes = annotations.map((annotation) => `<article class="annotation"><h3>${escapeHtml(getWorldName(worlds.find((world) => world.id === annotation.worldId) ?? worlds[0], locale, t))}</h3>${annotation.quote ? `<blockquote>${escapeHtml(annotation.quote)}</blockquote>` : ""}<p>${escapeHtml(annotation.note)}</p></article>`).join("");
    const protocol = `<section class="protocol"><h2>${escapeHtml(t.protocol)}</h2><h3>${escapeHtml(t.hypothesis)}</h3><p>${escapeHtml(hypothesis || "—")}</p><h3>${escapeHtml(t.matrix)}</h3><table><thead><tr><th>${escapeHtml(t.metricSelection)}</th>${worlds.map((world) => `<th>0${world.id}</th>`).join("")}</tr></thead><tbody>${metricsTable}</tbody></table><h3>${escapeHtml(t.annotations)}</h3>${notes || `<p>—</p>`}<h3>${escapeHtml(t.conclusion)}</h3><p class="conclusion">${escapeHtml(conclusion || "—")}</p></section>`;
    const report = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${escapeHtml(t.reportTitle)}</title><style>body{max-width:1050px;margin:60px auto;padding:0 30px;background:#f3f1eb;color:#151514;font-family:Arial,sans-serif}header{border-bottom:2px solid #151514;padding-bottom:28px}header b{font-size:20px}h1{font-size:52px;letter-spacing:-.05em;line-height:1;margin:35px 0 20px}header p,.note{color:#68665f}section{padding:34px 0;border-bottom:1px solid #151514}h2{font-size:28px}h3,dt{font:10px monospace;text-transform:uppercase;letter-spacing:.1em;color:#68665f}dl{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}dd{margin:7px 0 0;font-size:18px}.response{font:17px/1.6 Georgia,serif}.instruction,.conclusion{border-left:3px solid #ff4d00;padding-left:12px}table{width:100%;border-collapse:collapse;margin:12px 0 26px}th,td{padding:10px;border:1px solid #bbb8b0;text-align:left;font-size:12px}.annotation{padding:14px 0;border-bottom:1px solid #ccc}.annotation blockquote{margin:8px 0;padding-left:12px;border-left:2px solid #ff4d00;font-family:Georgia,serif}@media print{body{margin:0;background:white}}@media(max-width:700px){dl{grid-template-columns:1fr 1fr}h1{font-size:38px}}</style></head><body><header><b>LATENT ●</b><h1>${escapeHtml(t.reportTitle)}</h1><p>${escapeHtml(prompt)}</p><p class="note">${escapeHtml(t.simulatedLocally)}</p></header>${protocol}${rows}</body></html>`;
    const url = URL.createObjectURL(new Blob([report], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `latent-report-${experimentId}.html`; anchor.click(); URL.revokeObjectURL(url);
    setNotice(t.reportExported); window.setTimeout(() => setNotice(""), 2200);
  }

  const effectiveProgress = running ? progress : scrub;

  return (
    <main className="shell">
      <header className="topbar">
        <button className="wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="LATENT home">LATENT<span className="wordmark-dot">●</span></button>
        <div className="scenario"><span>{t.scenario}</span><strong>{t.modelDivergence}</strong></div>
        <div className="top-actions">
          <button className="help-button" onClick={() => setOnboardingOpen(true)}>{t.howItWorks}</button>
          <button className={`save-state ${saved ? "is-saved" : ""}`} onClick={() => setLibraryOpen(true)} aria-label={t.saveLibrary}>{saved ? t.saved : t.unsaved}</button>
          <div className="language-switch" aria-label={t.language}><button aria-pressed={locale === "ru"} onClick={() => changeLocale("ru")}>RU</button><button aria-pressed={locale === "en"} onClick={() => changeLocale("en")}>EN</button></div>
          <a href="https://github.com/resarytrew/LATENT" target="_blank" rel="noreferrer" className="repo-link">{t.source}</a>
        </div>
      </header>

      {notice && <div className="notice" role="status">{notice}</div>}

      {demoCoach && <section className={`coach ${progress === 100 ? "ready" : ""}`} aria-live="polite"><div><span>{progress === 100 ? "03 / COMPARE" : "01—02 / RUN"}</span><p>{progress === 100 ? t.demoReady : t.demoRunning}</p></div><div>{progress === 100 && <><button onClick={() => setCompareOpen(true)}>{t.compareNow}</button><button onClick={() => openReality()}>{t.changeCondition}</button></>}<button className="coach-close" onClick={() => setDemoCoach(false)} aria-label={t.hideHint}>×</button></div></section>}

      <section className="protocol-input">
        <div className="protocol-index">{t.protocol}</div>
        <label className="hypothesis-field"><span>{t.hypothesis}</span><textarea rows={2} value={hypothesis} onChange={(event) => { setHypothesis(event.target.value); markResearchDirty(); }} placeholder={t.hypothesisPlaceholder} /></label>
        <fieldset><legend>{t.metricSelection}</legend><div>{metricIds.map((metric) => <label key={metric} className={selectedMetrics.includes(metric) ? "selected" : ""}><input type="checkbox" checked={selectedMetrics.includes(metric)} onChange={() => toggleMetric(metric)} /><span>{t[`metric_${metric}`]}</span></label>)}</div></fieldset>
      </section>

      <section className="brief">
        <div className="brief-index">{t.input}</div>
        <div className="brief-main">
          <p className="eyebrow">{t.motto}</p>
          <textarea ref={promptRef} aria-label={t.promptLabel} placeholder={t.promptPlaceholder} value={prompt} onChange={(event) => { setPrompt(event.target.value); markDirty(); }} rows={2} spellCheck="false" />
          <div className="prompt-meta"><span>{t.onePrompt}</span><span>{t.mockProvider}</span><span>{worlds.length} {t.worlds}</span></div>
          <div className="preset-row"><span>{t.presets}</span><div>{presetIds.map((id) => <button key={id} onClick={() => applyPreset(id)}>{t[`preset_${id}`]}</button>)}</div></div>
        </div>
        <div className="brief-actions">
          <button className="run-button" onClick={runAll} disabled={running || !prompt.trim()}><span>{running ? `${t.running} ${progress}%` : t.run}</span><b>{running ? "···" : "→"}</b></button>
          <button className="quiet-button" onClick={() => openReality()} disabled={worlds.length >= 4}>{t.newReality}</button>
        </div>
      </section>

      <section className={`world-grid count-${worlds.length}`} aria-label={t.worlds}>
        {worlds.map((world, index) => {
          const response = responses[index];
          const parentIndex = world.parentId ? worlds.findIndex((item) => item.id === world.parentId) : -1;
          const pivot = parentIndex >= 0 ? commonPrefix(responses[parentIndex], response) : response.length;
          const visibleChars = Math.round(response.length * effectiveProgress / 100);
          const before = response.slice(0, Math.min(visibleChars, pivot));
          const after = response.slice(pivot, visibleChars);
          return (
            <article key={world.id} className={`world ${activeWorld === world.id ? "active" : ""}`} style={{ "--accent": world.color } as CSSProperties} onClick={() => setActiveWorld(world.id)}>
              <div className="world-topline"><span>0{world.id}</span><span>{running ? t.streaming : progress === 100 ? t.complete : t.ready}</span></div>
              <h2>{getWorldName(world, locale, t)}</h2>
              <p className="stance">{t[`stance_${world.stance}`]}</p>
              <p className="profile-badge">{t.profile}: <strong>{t[`profile_${world.profile}`]}</strong></p>
              {world.parentId && world.changedKey && <div className="condition-diff"><span>{t[`changed_${world.changedKey}`]}</span><strong>{getConditionValue(world, t)}</strong></div>}
              <div className="controls">
                <label><span>{t.temperature}</span><output>{world.temperature.toFixed(1)}</output><input type="range" min="0" max="1.4" step="0.1" value={world.temperature} onClick={(event) => event.stopPropagation()} onChange={(event) => updateTemperature(world.id, Number(event.target.value))} aria-label={`${getWorldName(world, locale, t)} ${t.temperature}`} /></label>
                <div><span>{t.seed}</span><strong>{world.seed}</strong></div>
              </div>
              <div className={`response ${visibleChars === 0 ? "empty" : ""}`} aria-live={running ? "polite" : "off"}>
                {visibleChars === 0 ? t.noGeneration : <><span>{before}</span>{after && <mark>{after}</mark>}{running && <i className="cursor" />}</>}
              </div>
              <footer><span>{Math.round(response.length / 4)} {t.tokens}</span><div><button disabled={progress !== 100} onClick={(event) => { event.stopPropagation(); openAnnotation(world.id); }}>{t.addNote}</button><button onClick={(event) => { event.stopPropagation(); setInspectorWorldId(world.id); }}>{t.conditions}</button><button onClick={(event) => { event.stopPropagation(); setCompareLeft(world.parentId ?? worlds[0].id); setCompareRight(world.id); setCompareOpen(true); }}>{t.inspect}</button></div></footer>
            </article>
          );
        })}
      </section>

      {progress === 100 && <section className="matrix-section">
        <div className="section-heading"><div><span>03 / MATRIX</span><strong>{t.matrix}</strong><p>{t.matrixHint}</p></div><label><span>{t.currentMetric}</span><select value={matrixMetric} onChange={(event) => setMatrixMetric(event.target.value as MetricKey)}>{selectedMetrics.map((metric) => <option key={metric} value={metric}>{t[`metric_${metric}`]}</option>)}</select></label></div>
        <div className="matrix-scroll"><table><thead><tr><th>WORLD</th>{worlds.map((world) => <th key={world.id}>0{world.id}<small>{getWorldName(world, locale, t)}</small></th>)}</tr></thead><tbody>{worlds.map((rowWorld, rowIndex) => <tr key={rowWorld.id}><th>0{rowWorld.id}<small>{getWorldName(rowWorld, locale, t)}</small></th>{worlds.map((columnWorld, columnIndex) => <td key={columnWorld.id}>{rowIndex === columnIndex ? <span>—</span> : <button onClick={() => { setCompareLeft(rowWorld.id); setCompareRight(columnWorld.id); setCompareOpen(true); }}>{metricDifference(matrixMetric, responses[rowIndex], responses[columnIndex], locale)}%</button>}</td>)}</tr>)}</tbody></table></div>
      </section>}

      {progress === 100 && <section className="research-results">
        <div className="section-heading"><div><span>04 / INTERPRET</span><strong>{t.annotations}</strong></div><button onClick={saveResearch}>{t.saveResearch}</button></div>
        <div className="research-grid"><div className="annotation-list">{annotations.length === 0 ? <p className="empty-annotations">{t.noAnnotations}</p> : annotations.map((annotation) => { const world = worlds.find((item) => item.id === annotation.worldId) ?? worlds[0]; return <article key={annotation.id}><header><span>{getWorldName(world, locale, t)}</span><button onClick={() => removeAnnotation(annotation.id)}>×</button></header>{annotation.quote && <blockquote>{annotation.quote}</blockquote>}<p>{annotation.note}</p></article>; })}</div><label className="conclusion-field"><span>{t.conclusion}</span><textarea rows={8} value={conclusion} onChange={(event) => { setConclusion(event.target.value); markResearchDirty(); }} placeholder={t.conclusionPlaceholder} /></label></div>
        <details className="metric-glossary"><summary>{t.metricGuide}</summary><div>{metricIds.map((metric) => <article key={metric}><strong>{t[`metric_${metric}`]}</strong><p>{t[`metricHelp_${metric}`]}</p></article>)}</div></details>
      </section>}

      <section className="timeline" aria-label={t.timeline}>
        <div className="timeline-heading"><div><span>{t.trace}</span><strong>{t.timeline}</strong></div><div className="timeline-actions"><button onClick={togglePlayback} disabled={progress !== 100}>{playing ? t.pause : t.play}</button><button onClick={() => openReality()}>{t.branchEvent}</button><button onClick={() => setCompareOpen(true)}>{t.openCompare}</button><button onClick={exportReport} disabled={progress !== 100}>{t.exportReport}</button></div></div>
        <div className="timeline-range"><input type="range" min="0" max="100" value={scrub} onChange={(event) => { setScrub(Number(event.target.value)); setPlaying(false); if (playbackTimer.current) clearInterval(playbackTimer.current); }} aria-label={t.timeline} /><output>{scrub}%</output></div>
        <div className="timeline-track"><span className="timeline-progress" style={{ width: `${scrub}%` }} />{timelineEvents.map((event, index) => <button key={event.point} style={{ left: `${event.point}%` }} className={`${event.label === "diverged" ? "hot" : ""} ${selectedEvent === index ? "selected" : ""}`} onClick={() => { setSelectedEvent(index); setScrub(event.point); }} aria-label={`${t[event.label]} ${event.point}%`} />)}</div>
        <div className="timeline-labels"><span>{t.created}</span><span>{t.changed}</span><span>{t.diverged}</span><span>{t.completed}</span></div>
      </section>

      <footer className="footer-note"><p>{t.integrity}</p><span>{t.local}</span></footer>
      <div className="mobile-dock"><button onClick={runAll} disabled={running || !prompt.trim()}>{running ? `${progress}%` : t.run}</button><button onClick={() => setCompareOpen(true)}>{t.openCompare}</button></div>

      {onboardingOpen && <div className="onboarding-backdrop"><section className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <header><button className="onboarding-brand" aria-label="LATENT">LATENT<span>●</span></button><div className="language-switch" aria-label={t.language}><button aria-pressed={locale === "ru"} onClick={() => changeLocale("ru")}>RU</button><button aria-pressed={locale === "en"} onClick={() => changeLocale("en")}>EN</button></div></header>
        <div className="onboarding-grid"><div className="onboarding-copy"><p className="onboarding-kicker">{t.onboardingKicker}</p><h1 id="onboarding-title">{t.onboardingTitle}</h1><p className="onboarding-body">{t.onboardingBody}</p><div className="onboarding-actions"><button className="run-button" onClick={startExample}><span>{t.watchDemo}</span><b>→</b></button><button className="quiet-button" onClick={startOwnQuestion}>{t.ownQuestion}</button></div></div>
          <div className="onboarding-visual" aria-hidden="true"><div className="origin"><span>{t.onePrompt}</span><i /></div><div className="branches"><div><i /><i /><i /><i /></div><div><i /><i /><i /><i /><i /></div><div><i /><i /><i /></div></div><b>{t.diverged}</b></div>
        </div>
        <ol className="onboarding-steps"><li><span>01</span><div><strong>{t.stepOne}</strong><p>{t.stepOneBody}</p></div></li><li><span>02</span><div><strong>{t.stepTwo}</strong><p>{t.stepTwoBody}</p></div></li><li><span>03</span><div><strong>{t.stepThree}</strong><p>{t.stepThreeBody}</p></div></li></ol>
      </section></div>}

      {annotationWorld && <div className="modal-backdrop" onMouseDown={() => setAnnotationWorldId(null)}><section className="dialog annotation-dialog" role="dialog" aria-modal="true" aria-labelledby="annotation-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>{getWorldName(annotationWorld, locale, t)}</span><h2 id="annotation-title">{t.addNote}</h2></div><button onClick={() => setAnnotationWorldId(null)} aria-label={t.close}>×</button></header>
        <div className="form-grid annotation-form"><label className="wide"><span>{t.quote}</span><textarea rows={4} value={draftQuote} onChange={(event) => setDraftQuote(event.target.value)} /></label><label className="wide"><span>{t.note}</span><textarea autoFocus rows={5} value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder={t.notePlaceholder} /></label></div>
        <div className="dialog-actions"><button className="quiet-button" onClick={() => setAnnotationWorldId(null)}>{t.cancel}</button><button className="run-button" onClick={addAnnotation} disabled={!draftNote.trim()}><span>{t.addAnnotation}</span><b>→</b></button></div>
      </section></div>}

      {inspectorWorld && <div className="modal-backdrop" onMouseDown={() => setInspectorWorldId(null)}><section className="dialog inspector-dialog" role="dialog" aria-modal="true" aria-labelledby="inspector-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>0{inspectorWorld.id} / {t.conditions}</span><h2 id="inspector-title">{getWorldName(inspectorWorld, locale, t)}</h2></div><button onClick={() => setInspectorWorldId(null)} aria-label={t.close}>×</button></header>
        <div className="form-grid inspector-grid">
          <label><span>{t.profile}</span><select value={inspectorWorld.profile} onChange={(event) => updateWorld(inspectorWorld.id, { profile: event.target.value as ModelProfile }, "profile")}>{(["balanced","precise","creative"] as ModelProfile[]).map((profile) => <option key={profile} value={profile}>{t[`profile_${profile}`]}</option>)}</select></label>
          <label><span>{t.stance}</span><select value={inspectorWorld.stance} onChange={(event) => updateWorld(inspectorWorld.id, { stance: event.target.value as Stance }, "stance")}>{(["systems","civic","speculative","skeptic"] as Stance[]).map((stance) => <option key={stance} value={stance}>{t[`stance_${stance}`]}</option>)}</select></label>
          <label><span>{t.temperature}: {inspectorWorld.temperature.toFixed(1)}</span><input type="range" min="0" max="1.4" step="0.1" value={inspectorWorld.temperature} onChange={(event) => updateWorld(inspectorWorld.id, { temperature: Number(event.target.value) }, "temperature")} /></label>
          <label><span>{t.seed}</span><input type="number" value={inspectorWorld.seed} onChange={(event) => updateWorld(inspectorWorld.id, { seed: Number(event.target.value) }, "seed")} /></label>
          <label className="wide"><span>{t.systemInstruction}</span><textarea rows={5} value={inspectorWorld.systemInstruction} onChange={(event) => updateWorld(inspectorWorld.id, { systemInstruction: event.target.value }, "systemInstruction")} placeholder={t.systemPlaceholder} /></label>
        </div>
        <div className="dialog-actions"><button className="run-button" onClick={() => setInspectorWorldId(null)}><span>{t.saveChanges}</span><b>→</b></button></div>
      </section></div>}

      {realityOpen && <div className="modal-backdrop" onMouseDown={() => setRealityOpen(false)}><section className="dialog reality-dialog" role="dialog" aria-modal="true" aria-labelledby="reality-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>{t.changeOnly}</span><h2 id="reality-title">{t.createReality}</h2></div><button onClick={() => setRealityOpen(false)} aria-label={t.close}>×</button></header>
        <div className="form-grid">
          <label><span>{t.branchFrom}</span><select value={draftBase} onChange={(event) => setDraftBase(Number(event.target.value))}>{worlds.map((world) => <option key={world.id} value={world.id}>{getWorldName(world, locale, t)}</option>)}</select></label>
          <label><span>{t.condition}</span><select value={draftCondition} onChange={(event) => setDraftCondition(event.target.value as ConditionKey)}><option value="temperature">{t.temperature}</option><option value="seed">{t.seed}</option><option value="stance">{t.stance}</option><option value="profile">{t.profile}</option><option value="systemInstruction">{t.systemInstruction}</option></select></label>
          {draftCondition === "temperature" && <label className="wide"><span>{t.temperature}: {draftTemperature.toFixed(1)}</span><input type="range" min="0" max="1.4" step="0.1" value={draftTemperature} onChange={(event) => setDraftTemperature(Number(event.target.value))} /></label>}
          {draftCondition === "seed" && <label className="wide"><span>{t.seed}</span><input type="number" value={draftSeed} onChange={(event) => setDraftSeed(Number(event.target.value))} /></label>}
          {draftCondition === "stance" && <label className="wide"><span>{t.stance}</span><select value={draftStance} onChange={(event) => setDraftStance(event.target.value as Stance)}>{(["systems","civic","speculative","skeptic"] as Stance[]).map((stance) => <option key={stance} value={stance}>{t[`stance_${stance}`]}</option>)}</select></label>}
          {draftCondition === "profile" && <label className="wide"><span>{t.profile}</span><select value={draftProfile} onChange={(event) => setDraftProfile(event.target.value as ModelProfile)}>{(["balanced","precise","creative"] as ModelProfile[]).map((profile) => <option key={profile} value={profile}>{t[`profile_${profile}`]}</option>)}</select></label>}
          {draftCondition === "systemInstruction" && <label className="wide"><span>{t.systemInstruction}</span><textarea rows={4} value={draftSystemInstruction} onChange={(event) => setDraftSystemInstruction(event.target.value)} placeholder={t.systemPlaceholder} /></label>}
        </div>
        <div className="dialog-actions"><button className="quiet-button" onClick={() => setRealityOpen(false)}>{t.cancel}</button><button className="run-button" onClick={createReality}><span>{t.create}</span><b>→</b></button></div>
      </section></div>}

      {libraryOpen && <div className="modal-backdrop" onMouseDown={() => setLibraryOpen(false)}><section className="dialog library-dialog" role="dialog" aria-modal="true" aria-labelledby="library-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>{experiments.length} / 20</span><h2 id="library-title">{t.savedExperiments}</h2></div><button onClick={() => setLibraryOpen(false)} aria-label={t.close}>×</button></header>
        <div className="library-toolbar"><button onClick={newExperiment}>{t.newExperiment}</button><button onClick={exportJson}>{t.export}</button><button onClick={exportReport} disabled={progress !== 100}>{t.exportReport}</button><button onClick={() => importRef.current?.click()}>{t.import}</button><input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => void importJson(event.target.files?.[0])} /></div>
        <div className="saved-list">{experiments.length === 0 ? <p className="empty-library">{t.emptySaved}</p> : experiments.map((experiment) => <article className="saved-item" key={experiment.id}><div className="saved-summary"><div><h3>{experiment.prompt}</h3><p>{new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(experiment.updatedAt))} · {experiment.worlds.length} {t.worlds} · {experiment.versions?.length ?? 0} {t.versions}</p></div><div><button onClick={() => openSaved(experiment)}>{t.open}</button><button onClick={() => duplicateSaved(experiment)}>{t.duplicate}</button><button onClick={() => removeSaved(experiment.id)}>{t.remove}</button></div></div>{experiment.versions && experiment.versions.length > 1 && <details className="version-list"><summary>{t.versions}: {experiment.versions.length}</summary><div>{experiment.versions.map((version, index) => <button key={version.id} onClick={() => openVersion(experiment.id, version)}><span>{t.version} {experiment.versions!.length - index}</span><small>{new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(version.createdAt))}</small></button>)}</div></details>}</article>)}</div>
      </section></div>}

      {compareOpen && <div className="compare-backdrop" onMouseDown={() => setCompareOpen(false)}><section className="compare-panel" role="dialog" aria-modal="true" aria-labelledby="compare-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><div><span>{t.compareReport}</span><h2 id="compare-title">{t.whereSplit}</h2></div><button onClick={() => setCompareOpen(false)} aria-label={t.close}>×</button></header>
        <div className="compare-selectors"><label><span>{t.leftWorld}</span><select value={compareLeft} onChange={(event) => setCompareLeft(Number(event.target.value))}>{worlds.map((world) => <option key={world.id} value={world.id}>{getWorldName(world, locale, t)}</option>)}</select></label><label><span>{t.rightWorld}</span><select value={compareRight} onChange={(event) => setCompareRight(Number(event.target.value))}>{worlds.map((world) => <option key={world.id} value={world.id}>{getWorldName(world, locale, t)}</option>)}</select></label></div>
        <div className="metric-grid"><div className="score"><strong>{comparison.lexical}%</strong><span>{t.lexical}</span></div><div><strong>{comparison.prefix}</strong><span>{t.commonPrefix}, {t.characters}</span></div><div><strong>{comparison.distance}%</strong><span>{t.editDistance}</span></div><div><strong>{comparison.length}</strong><span>{t.lengthDelta}, {t.characters}</span></div></div>
        <div className="compare-columns"><article><h3>{getWorldName(worlds[leftIndex], locale, t)}</h3><p><span>{leftResponse.slice(0, comparison.prefix)}</span><mark>{leftResponse.slice(comparison.prefix)}</mark></p></article><article><h3>{getWorldName(worlds[rightIndex], locale, t)}</h3><p><span>{rightResponse.slice(0, comparison.prefix)}</span><mark>{rightResponse.slice(comparison.prefix)}</mark></p></article></div>
        <div className="boundary-note"><b>{t.interpretation}</b><p>{t.boundary}</p></div><button className="panel-action" onClick={() => setCompareOpen(false)}>{t.returnExperiment}</button>
      </section></div>}
    </main>
  );
}
