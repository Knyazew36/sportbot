// Вливает в catalog.json то, что уже применено на проде: патч (формат импорта) или guides.json.
// catalog.json — полный справочник для чистой установки (content.sh); после merge он совпадает с продом.
// Запуск из apps/server: yarn content:merge <файл.json> [ещё файлы…]
/// <reference types="node" />
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import type { GuidesFile } from './content-sources/files';

const CATALOG = path.join(__dirname, 'content', 'catalog.json');

type Item = Record<string, unknown> & { code?: string };
type Catalog = Record<string, Item[]>;

const SECTIONS = [
  'exercises',
  'stretches',
  'programTagGroups',
  'programTags',
  'programs',
] as const;

const read = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.resolve(file), 'utf-8').replace(/^﻿/, '')) as T;

/** Запись патча поверх записи справочника: поля из патча заменяют старые, остальные остаются. */
function upsert(list: Item[], item: Item): 'new' | 'updated' {
  const at = list.findIndex((x) => x.code === item.code);
  if (at < 0) {
    list.push(item);
    return 'new';
  }
  list[at] = { ...list[at], ...item };
  return 'updated';
}

function mergePatch(catalog: Catalog, patch: Catalog) {
  const counts: string[] = [];
  for (const section of SECTIONS) {
    const items = patch[section] ?? [];
    if (!items.length) continue;
    catalog[section] ??= [];
    let created = 0;
    for (const item of items)
      if (upsert(catalog[section], item) === 'new') created++;
    counts.push(`${section}: +${created}, ~${items.length - created}`);
  }
  return counts.join('; ');
}

function mergeGuides(catalog: Catalog, guides: GuidesFile) {
  let merged = 0;
  const skipped: number[] = [];
  for (const [section, field, entries] of [
    ['exercises', 'technique', guides.exercises],
    ['stretches', 'howTo', guides.stretches],
  ] as const) {
    for (const entry of entries) {
      // Черновики без code в catalog.json не попадают — их техника живёт только в базе
      const item = entry.code
        ? catalog[section]?.find((x) => x.code === entry.code)
        : undefined;
      if (!item) {
        skipped.push(entry.id);
        continue;
      }
      Object.assign(item, {
        [field]: entry.description,
        steps: entry.steps,
        mistakes: entry.mistakes,
        ...(entry.imageEnd ? { imageEnd: entry.imageEnd } : {}),
      });
      merged++;
    }
  }
  return `техника: ${merged}${skipped.length ? `, без code пропущены id ${skipped.join(', ')}` : ''}`;
}

function main() {
  const files = process.argv.slice(2);
  if (!files.length)
    throw new Error('Укажи файлы: yarn content:merge <патч.json|guides.json>');
  const catalog = read<Catalog>(CATALOG);
  for (const file of files) {
    const data = read<Record<string, unknown>>(file);
    const result =
      // У guides.json есть exportedAt и нет programs; снимок content:export сюда не подают
      'exportedAt' in data && !('programs' in data)
        ? mergeGuides(catalog, data as unknown as GuidesFile)
        : mergePatch(catalog, data as Catalog);
    console.log(`${file}: ${result}`);
  }
  fs.writeFileSync(CATALOG, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Обновлён ${CATALOG}`);
}

main();
