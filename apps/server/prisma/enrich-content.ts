// Новая техника записей справочника через Claude Batch API: перевод и адаптация текста источника
// для новичка. Только локально — ключ ANTHROPIC_API_KEY есть лишь на машине разработчика.
// Запуск из apps/server:
//   yarn content:enrich <export.json> [--only stretches|exercises] [--limit 10] [--out папка] [--batch <id>]
// --batch продолжает уже отправленный батч (id пишется в <out>/batch.json), не платя второй раз.
// Выход: <out>/guides.json для content:apply-guides и <out>/review.md для ручного ревью.
import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

import { normalizeName } from '../src/catalog/catalog.service';

import { freeExerciseFolder } from './content-sources/free-exercise-db';
import { bestMatches, stretchQueries } from './content-sources/match';
import type {
  ExportedExercise,
  ExportedStretch,
  ExportFile,
  GuideEntry,
  GuidesFile,
  StretchPositionCode,
} from './content-sources/files';
import {
  GUIDE_LIMITS,
  guideErrors,
  STRETCH_POSITIONS,
} from './content-sources/files';
import { readSnapshot } from './content-sources/snapshots';
import type { SourceRecord } from './content-sources/types';

const MODEL = 'claude-opus-5-5';
const POLL_MS = 30_000;

const EQUIPMENT_RU: Record<string, string> = {
  BARBELL: 'штанга',
  DUMBBELL: 'гантели',
  MACHINE: 'тренажёр',
  BODYWEIGHT: 'свой вес',
};

const SYSTEM = `Ты пишешь технику упражнений для справочника фитнес-приложения. Читатель — новичок в зале.

На входе: русское название, текущий текст записи (его писали и правили люди) и английская инструкция из источника.
На выходе: описание, шаги и ошибки на русском.

Факты:
- Используй только факты из текущего текста и инструкции источника. Ничего не добавляй от себя: ни углов, ни чисел, ни советов, ни ошибок, которых там нет.
- Если текущий текст и источник расходятся, верь текущему тексту: в нём правки людей.
- Все факты текущего текста должны остаться — в описании, шагах или ошибках.
- Нет данных для поля — оставь пустой массив, не выдумывай.
- Служебные фразы источника («repeat for the prescribed amount of repetitions») не переносим.

Поля:
- description — 1–3 коротких предложения: исходное положение, на что обратить внимание, темп.
- steps — шаги по порядку, по одному действию, с дыханием, если оно есть в источнике.
- mistakes — каждая ошибка сразу с исправлением одной строкой через тире: «Колени внутрь — разводи колени по линии носков». Исправление тоже берётся из текста; если опоры нет, исправление просто обращает ошибку.

Стиль: на «ты», коротко, просто, без медицинских обещаний и без восклицаний. Говори «очередь», а не «ротация».

Источников может быть несколько — бери факты из всех, на конфликт между ними верь текущему тексту, а без него — большинству. Пометка «Tip:» в источнике — подсказка или частая ошибка.`;

/** Растяжке нужны ещё «где тянет» и положение — по ним заминка показывает подсказку и строит порядок. */
const STRETCH_SYSTEM = `${SYSTEM}

Растяжка, дополнительно:
- feel — где должно тянуть, одной короткой строкой без точки: «задняя поверхность бедра опорной ноги». Только если это сказано в тексте или источнике; нет — пустая строка.
- position — исходное положение: STANDING (стоя), KNEELING (на коленях или в выпаде с коленом на полу), SITTING (сидя), LYING (лёжа на спине, животе или боку). Вис на перекладине — STANDING.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    mistakes: { type: 'array', items: { type: 'string' } },
  },
  required: ['description', 'steps', 'mistakes'],
  additionalProperties: false,
};

const STRETCH_SCHEMA = {
  ...OUTPUT_SCHEMA,
  properties: {
    ...OUTPUT_SCHEMA.properties,
    feel: { type: 'string' },
    position: { type: 'string', enum: [...STRETCH_POSITIONS] },
  },
  required: [...OUTPUT_SCHEMA.required, 'feel', 'position'],
};

/** Доп. источник текста растяжки берём только при уверенном совпадении названия. */
const EXTRA_MIN_SCORE = 1;
const EXTRA_SOURCES = 2;

type Kind = 'exercise' | 'stretch';

interface Job {
  kind: Kind;
  customId: string;
  entry: ExportedExercise | ExportedStretch;
  /** Первый — основной: из него берётся фото финиша. */
  sources: SourceRecord[];
  flags: string[];
}

interface CatalogFile {
  exercises: { code: string; name: string; image?: string }[];
  stretches: { code: string; name: string; image?: string }[];
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => {
    const at = args.indexOf(name);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const exportPath = args.find(
    (arg, i) => !arg.startsWith('--') && !args[i - 1]?.startsWith('--'),
  );
  if (!exportPath)
    throw new Error(
      'Укажи файл экспорта: yarn content:enrich <export.json> [--limit N]',
    );
  const limit = Number(option('--limit')) || Infinity;
  const only = option('--only');
  if (only && only !== 'stretches' && only !== 'exercises')
    throw new Error('--only: stretches или exercises');
  const outDir = path.resolve(option('--out') ?? 'enrich-out');
  fs.mkdirSync(outDir, { recursive: true });

  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf-8')) as ExportFile;
  const { jobs, missing } = buildJobs(exported, limit, only);
  console.log(
    `Пар с источником: ${jobs.length}, без источника: ${missing.length}`,
  );

  const client = new Anthropic();
  const batchFile = path.join(outDir, 'batch.json');
  let batchId = option('--batch');
  if (!batchId) {
    const batch = await client.messages.batches.create({
      requests: jobs.map((job) => ({
        custom_id: job.customId,
        params: {
          model: MODEL,
          max_tokens: 16000,
          system: job.kind === 'stretch' ? STRETCH_SYSTEM : SYSTEM,
          output_config: {
            effort: 'medium',
            format: {
              type: 'json_schema',
              schema: job.kind === 'stretch' ? STRETCH_SCHEMA : OUTPUT_SCHEMA,
            },
          },
          messages: [{ role: 'user', content: userPrompt(job) }],
        },
      })),
    });
    batchId = batch.id;
    fs.writeFileSync(batchFile, `${JSON.stringify({ batchId }, null, 2)}\n`);
    console.log(`Батч отправлен: ${batchId} (продолжить: --batch ${batchId})`);
  }

  for (;;) {
    const batch = await client.messages.batches.retrieve(batchId);
    if (batch.processing_status === 'ended') break;
    console.log(
      `Батч ${batchId}: в работе ${batch.request_counts.processing}, готово ${batch.request_counts.succeeded}`,
    );
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  const byId = new Map(jobs.map((job) => [job.customId, job]));
  const guides: GuidesFile = {
    exportedAt: exported.exportedAt,
    exercises: [],
    stretches: [],
  };
  const reviews: string[] = [];
  for await (const result of await client.messages.batches.results(batchId)) {
    const job = byId.get(result.custom_id);
    if (!job) continue;
    const parsed = parseResult(result, job.kind);
    if ('error' in parsed) {
      reviews.push(reviewBlock(job, null, [...job.flags, parsed.error]));
      continue;
    }
    const entry: GuideEntry = {
      id: job.entry.id,
      code: job.entry.code,
      updatedAt: job.entry.updatedAt,
      ...parsed,
      ...(!job.entry.imageEndPath && job.sources[0].images[1]
        ? { imageEnd: job.sources[0].images[1] }
        : {}),
      ...(job.kind === 'stretch' && {
        techniqueSources: job.sources.map((source) => source.url),
      }),
    };
    const errors = guideErrors(entry);
    if (errors.length) {
      reviews.push(reviewBlock(job, entry, [...job.flags, ...errors]));
      continue;
    }
    (job.kind === 'exercise' ? guides.exercises : guides.stretches).push(entry);
    reviews.push(reviewBlock(job, entry, job.flags));
  }

  fs.writeFileSync(
    path.join(outDir, 'guides.json'),
    `${JSON.stringify(guides, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, 'review.md'),
    [
      `# Ревью техники (экспорт ${exported.exportedAt})`,
      '',
      `Готово: упражнений ${guides.exercises.length}, растяжек ${guides.stretches.length}.`,
      '',
      ...reviews,
      ...(missing.length
        ? [
            '## Нет источника — не трогаем',
            '',
            ...missing.map((m) => `- ${m}`),
            '',
          ]
        : []),
    ].join('\n'),
  );
  console.log(`Готово: ${outDir}/guides.json и review.md`);
}

// ── Сопоставление ───────────────────────────────────────────────────────

function buildJobs(exported: ExportFile, limit: number, only?: string) {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'content', 'catalog.json'), 'utf-8'),
  ) as CatalogFile;
  const free = new Map(
    (readSnapshot('free-exercise-db')?.records ?? []).map((r) => [
      r.sourceId,
      r,
    ]),
  );
  if (!free.size)
    throw new Error('Нет снимка free-exercise-db — сначала yarn content:sources');
  // wger — запасной источник: пара по точному совпадению названия на любом языке
  const wger = new Map<string, SourceRecord>();
  for (const record of readSnapshot('wger')?.records ?? [])
    for (const name of [record.name, ...record.altNames])
      wger.set(normalizeName(name), record);

  // Тексты растяжек: RepDB и wger, пара по английскому названию (stretch-aliases.json, ссылка на фото)
  const stretchTexts = [
    ...(readSnapshot('repdb')?.records ?? []),
    ...(readSnapshot('wger')?.records ?? []),
  ];

  const jobs: Job[] = [];
  const missing: string[] = [];
  const entries = [
    ...(only === 'stretches'
      ? []
      : exported.exercises.map((entry) => ({ kind: 'exercise' as const, entry }))),
    ...(only === 'exercises'
      ? []
      : exported.stretches
          // Разминку не трогаем: этап про заминку
          .filter((entry) => entry.kind !== 'WARMUP')
          .map((entry) => ({ kind: 'stretch' as const, entry }))),
  ];
  for (const { kind, entry } of entries) {
    if (jobs.length >= limit) break;
    const known = (
      kind === 'exercise' ? catalog.exercises : catalog.stretches
    ).find((item) => entry.code && item.code === entry.code);
    const flags: string[] = [];
    let source = free.get(freeExerciseFolder(known?.image) ?? '');
    if (source && known && normalizeName(known.name) !== normalizeName(entry.name))
      flags.push(
        `проверить пару: в catalog.json «${known.name}», в базе «${entry.name}»`,
      );
    if (!source) {
      source = wger.get(normalizeName(entry.name));
      if (source) flags.push('проверить пару: wger, подобрано по названию');
    }
    const sources = source ? [source] : [];
    if (kind === 'stretch') {
      const extra = bestMatches(
        stretchQueries(entry.code, known?.image),
        stretchTexts.filter((r) => r.instructions.length && r !== source),
        { top: EXTRA_SOURCES, minScore: EXTRA_MIN_SCORE, strict: true },
      );
      for (const { record } of extra) sources.push(record);
      if (extra.length) flags.push('проверить доп. источники: подобраны по названию');
    }
    if (!sources.length) {
      missing.push(`${kind} #${entry.id} «${entry.name}»`);
      continue;
    }
    jobs.push({
      kind,
      customId: `${kind === 'exercise' ? 'e' : 's'}-${entry.id}`,
      entry,
      sources,
      flags,
    });
  }
  return { jobs, missing };
}

// ── Запрос и ответ ──────────────────────────────────────────────────────

function userPrompt(job: Job): string {
  const { entry } = job;
  const current = currentText(job);
  const details =
    'equipment' in entry
      ? [
          `Инвентарь: ${entry.equipment ? EQUIPMENT_RU[entry.equipment] : 'не указан'}`,
          `Мышцы: ${entry.muscles.map((m) => `${m.code}${m.role === 'PRIMARY' ? '' : ' (помогает)'}`).join(', ')}`,
        ]
      : [
          `Растяжка, удержание ${entry.holdSeconds} с${entry.perSide ? ' на каждую сторону' : ''}`,
          `Тянет: ${entry.muscles.join(', ')}`,
        ];
  return [
    `Название: ${entry.name}`,
    ...details,
    '',
    '<current_text>',
    current || '(пусто)',
    '</current_text>',
    '',
    ...job.sources.flatMap((source) => [
      `<source name="${source.source}" title="${source.name}">`,
      ...source.instructions.map((line, i) => `${i + 1}. ${line}`),
      '</source>',
    ]),
    '',
    `Лимиты: описание до ${GUIDE_LIMITS.description} символов, до ${GUIDE_LIMITS.items} пунктов в списке, пункт до ${GUIDE_LIMITS.item} символов.`,
  ].join('\n');
}

/** Всё, что сейчас написано у записи: описание, шаги и ошибки. */
function currentText(job: Job): string {
  const { entry } = job;
  const description = 'technique' in entry ? entry.technique : entry.howTo;
  return [
    description?.trim(),
    entry.steps.length ? `Шаги:\n${entry.steps.join('\n')}` : '',
    entry.mistakes.length ? `Ошибки:\n${entry.mistakes.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function parseResult(
  result: Anthropic.Messages.MessageBatchIndividualResponse,
  kind: Kind,
):
  | Pick<GuideEntry, 'description' | 'steps' | 'mistakes' | 'feel' | 'position'>
  | { error: string } {
  if (result.result.type !== 'succeeded')
    return { error: `запрос не выполнен: ${result.result.type}` };
  const message = result.result.message;
  if (message.stop_reason !== 'end_turn')
    return { error: `модель остановилась: ${message.stop_reason}` };
  const text = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  try {
    const value = JSON.parse(text?.text ?? '') as {
      description: string;
      steps: string[];
      mistakes: string[];
      feel?: string;
      position?: StretchPositionCode;
    };
    return {
      description: value.description.trim(),
      steps: value.steps.map((s) => s.trim()).filter(Boolean),
      mistakes: value.mistakes.map((m) => m.trim()).filter(Boolean),
      ...(kind === 'stretch' && {
        feel: value.feel?.trim() ?? '',
        position: value.position,
      }),
    };
  } catch {
    return { error: 'ответ не разобрался как JSON' };
  }
}

// ── Ревью ───────────────────────────────────────────────────────────────

function reviewBlock(job: Job, entry: GuideEntry | null, flags: string[]) {
  const list = (items: string[], numbered: boolean) =>
    items.map((item, i) => `${numbered ? `${i + 1}.` : '-'} ${item}`);
  return [
    `## ${job.kind === 'exercise' ? 'Упражнение' : 'Растяжка'} #${job.entry.id} «${job.entry.name}»`,
    '',
    ...job.sources.map(
      (source) => `Источник: ${source.source} — [${source.name}](${source.url})`,
    ),
    ...flags.map((flag) => `> ⚠️ ${flag}`),
    '',
    '**Было:**',
    '',
    currentText(job) || '(пусто)',
    '',
    ...(entry
      ? [
          '**Стало:**',
          '',
          entry.description,
          '',
          '*Шаги:*',
          ...list(entry.steps, true),
          '',
          '*Ошибки:*',
          ...list(entry.mistakes, false),
          ...(entry.feel !== undefined
            ? ['', `*Тянет:* ${entry.feel || '—'}`, `*Положение:* ${entry.position}`]
            : []),
          ...(entry.imageEnd ? ['', `Фото финиша: ${entry.imageEnd}`] : []),
        ]
      : ['**Стало:** — (в guides.json не попало)']),
    '',
  ].join('\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
