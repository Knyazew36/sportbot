// Собирает guides-файл растяжек заминки из снимка прода и ручных дополнений
// (content/stretch-guides-<дата>.json: feel, position, новые ошибки по code).
// Описание и шаги берутся из снимка как есть, ошибки — текущие плюс новые без повторов,
// techniqueSources — те же источники, что подбирает content:enrich.
// Запуск из apps/server: yarn content:stretch-guides <дополнения.json> <выход.json> [снимок.json]
// Снимок по умолчанию — content/prod/catalog-export.json.
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import { freeExerciseFolder } from './content-sources/free-exercise-db';
import type {
  ExportFile,
  GuideEntry,
  GuidesFile,
  StretchPositionCode,
} from './content-sources/files';
import { guideErrors } from './content-sources/files';
import { bestMatches, stretchQueries } from './content-sources/match';
import { readSnapshot } from './content-sources/snapshots';

const CONTENT = path.join(__dirname, 'content');
const EXPORT = path.join(CONTENT, 'prod', 'catalog-export.json');

interface Addition {
  feel?: string;
  position?: StretchPositionCode;
  mistakes?: string[];
}

function main() {
  const [additionsPath, outPath, exportPath = EXPORT] = process.argv.slice(2);
  if (!additionsPath || !outPath)
    throw new Error('Запуск: yarn content:stretch-guides <дополнения.json> <выход.json>');
  const prod = JSON.parse(fs.readFileSync(path.resolve(exportPath), 'utf-8')) as ExportFile;
  const additions = JSON.parse(
    fs.readFileSync(path.resolve(additionsPath), 'utf-8'),
  ) as Record<string, Addition>;
  const catalog = JSON.parse(
    fs.readFileSync(path.join(CONTENT, 'catalog.json'), 'utf-8'),
  ) as { stretches: { code: string; image?: string }[] };
  const image = new Map(catalog.stretches.map((s) => [s.code, s.image]));
  const free = new Map(
    (readSnapshot('free-exercise-db')?.records ?? []).map((r) => [r.sourceId, r]),
  );
  const texts = [
    ...(readSnapshot('repdb')?.records ?? []),
    ...(readSnapshot('wger')?.records ?? []),
  ].filter((r) => r.instructions.length);

  const guides: GuidesFile = {
    exportedAt: prod.exportedAt,
    exercises: [],
    stretches: [],
  };
  const errors: string[] = [];
  for (const stretch of prod.stretches) {
    // По code: id на проде и в локальной базе разные. Запись без code — по #id прода
    const addition = additions[stretch.code ?? `#${stretch.id}`];
    if (!addition) continue;
    const img = stretch.code ? image.get(stretch.code) : undefined;
    const primary = free.get(freeExerciseFolder(img) ?? '');
    const extra = bestMatches(
      stretchQueries(stretch.code, img),
      texts.filter((r) => r !== primary),
      { top: 2, minScore: 1, strict: true },
    ).map((m) => m.record);
    const sources = [...(primary ? [primary] : []), ...extra];
    const entry: GuideEntry = {
      id: stretch.id,
      code: stretch.code,
      updatedAt: stretch.updatedAt,
      description: stretch.howTo ?? '',
      steps: stretch.steps,
      mistakes: [
        ...stretch.mistakes,
        ...(addition.mistakes ?? []).filter((m) => !stretch.mistakes.includes(m)),
      ],
      ...(addition.feel !== undefined && { feel: addition.feel }),
      ...(addition.position && { position: addition.position }),
      ...(sources.length && { techniqueSources: sources.map((s) => s.url) }),
    };
    const problems = guideErrors(entry);
    if (problems.length) errors.push(`#${stretch.id}: ${problems.join(', ')}`);
    else guides.stretches.push(entry);
  }
  const missing = Object.keys(additions).filter(
    (key) =>
      !key.startsWith('_') &&
      !prod.stretches.some((s) => (s.code ?? `#${s.id}`) === key),
  );
  fs.writeFileSync(path.resolve(outPath), `${JSON.stringify(guides, null, 2)}\n`);
  console.log(
    `Растяжек: ${guides.stretches.length} → ${outPath}${missing.length ? `; нет в снимке: ${missing.join(', ')}` : ''}`,
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}

main();
