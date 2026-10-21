// Кандидаты фото и текстов для растяжек заминки из снимков sources/*.json.
// Читает только снимок прода (content:export), не catalog.json: на проде могли поправить.
// Выход — enrich-out/stretch-media-review.md: по каждой растяжке кандидаты фото и текстов
// с превью, лицензией и автором. Человек выбирает, выбранное идёт в патч частичной записью.
// Запуск из apps/server: yarn content:stretch-media [--all] (без --all — только растяжки без фото)
/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

import type { ExportFile } from './content-sources/files';
import { readSnapshot } from './content-sources/snapshots';
import { bestMatches, stretchQueries } from './content-sources/match';

const CONTENT = path.join(__dirname, 'content');
const EXPORT = path.join(CONTENT, 'prod', 'catalog-export.json');
const OUT = path.join(__dirname, '..', 'enrich-out', 'stretch-media-review.md');
/** Источники фото и текстов. free-exercise-db не берём: старые фото уже оттуда. */
const PHOTO_SOURCES = ['wikimedia-commons', 'wger'];
const TEXT_SOURCES = ['repdb', 'wger'];
/** Фото кандидатов смотрим глазами, поэтому показываем с запасом: лучшие по названию — не всегда лучшие по позе. */
const TOP_PHOTOS = 8;

function main() {
  const all = process.argv.includes('--all');
  if (!fs.existsSync(EXPORT))
    throw new Error(`Нет снимка прода ${EXPORT}: сначала content:export (README, шаг 1)`);
  const prod = JSON.parse(fs.readFileSync(EXPORT, 'utf-8')) as ExportFile;
  const catalog = JSON.parse(
    fs.readFileSync(path.join(CONTENT, 'catalog.json'), 'utf-8'),
  ) as { stretches: { code: string; image?: string; kind?: string }[] };
  const byCode = new Map(catalog.stretches.map((s) => [s.code, s]));
  const load = (names: string[]) =>
    names.flatMap((name) => {
      const snapshot = readSnapshot(name);
      if (!snapshot) console.warn(`Нет снимка ${name}: yarn content:sources ${name}`);
      return snapshot?.records ?? [];
    });
  const photos = load(PHOTO_SOURCES);
  const texts = load(TEXT_SOURCES);

  const stretches = prod.stretches.filter((s) => {
    const kind = s.kind ?? (s.code ? byCode.get(s.code)?.kind : undefined);
    return kind !== 'WARMUP' && (all || !s.imagePath);
  });

  const lines = [
    '# Фото и тексты для растяжек заминки',
    '',
    `Снимок прода: ${prod.exportedAt}. Растяжек: ${stretches.length}${all ? '' : ' (только без фото)'}.`,
    'Фото берём только настоящие и только под свободной лицензией; подходящее переносим в патч частичной записью',
    '(`code`, `image`, `imageSource`, `imageLicense`, `imageAuthor`) — без `muscles`, чтобы не затереть запись.',
    '',
  ];
  for (const s of stretches) {
    const queries = stretchQueries(s.code, s.code ? byCode.get(s.code)?.image : null);
    lines.push(`## ${s.name} · \`${s.code ?? `#${s.id}`}\``, '');
    if (!queries.length) {
      lines.push('Нет английского названия — добавь в `stretch-aliases.json`.', '');
      continue;
    }
    lines.push(`Искали: ${queries.map((q) => `«${q}»`).join(', ')}`, '', '**Фото:**', '');
    const found = bestMatches(queries, photos, { top: TOP_PHOTOS, needImages: true });
    if (!found.length) lines.push('— не найдено');
    for (const { record, score: value } of found) {
      const credit = record.imageCredits?.[0];
      lines.push(
        `- ${value.toFixed(2)} · [${record.name}](${credit?.page ?? record.url}) · ${record.source} · ${credit?.license ?? '?'}${credit?.author ? ` · ${credit.author}` : ''}`,
        `  - ${record.images[0]}`,
      );
    }
    lines.push('', '**Тексты:**', '');
    const guides = bestMatches(queries, texts);
    if (!guides.length) lines.push('— не найдено');
    for (const { record, score: value } of guides)
      lines.push(`- ${value.toFixed(2)} · [${record.name}](${record.url}) · ${record.source}`);
    lines.push('');
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`Растяжек: ${stretches.length} → ${OUT}`);
}

main();
