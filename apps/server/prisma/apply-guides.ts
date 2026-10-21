// Применение guides.json из content:enrich на сервере. Запуск из apps/server:
//   yarn content:apply-guides <guides.json> [--dry-run]
// Пишутся только описание, шаги, ошибки и фото финиша; у растяжек ещё «где тянет», положение
// и источники. Запись, изменённую после экспорта
// (updatedAt не совпал), скрипт пропускает: свежие правки людей не затираются.
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { resolveCatalogImage } from '../src/catalog/catalog-image';

import type { GuideEntry, GuidesFile } from './content-sources/files';
import { guideErrors } from './content-sources/files';
import { PrismaService } from './prisma.service';

const logger = new Logger('📚 ApplyGuides');

type Kind = 'exercise' | 'stretch';

interface Report {
  updated: string[];
  skipped: string[];
  errors: string[];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const file = args.find((arg) => !arg.startsWith('--'));
  if (!file)
    throw new Error('Укажи файл: yarn content:apply-guides <guides.json>');
  const guides = JSON.parse(
    fs.readFileSync(path.resolve(file), 'utf-8'),
  ) as GuidesFile;
  const prisma = new PrismaService();
  const report: Report = { updated: [], skipped: [], errors: [] };
  try {
    for (const [kind, entries] of [
      ['exercise', guides.exercises],
      ['stretch', guides.stretches],
    ] as [Kind, GuideEntry[]][])
      await applyKind(prisma, kind, entries, dryRun, report);
  } finally {
    await prisma.$disconnect();
  }
  console.log(
    [
      `${dryRun ? 'Проверка (--dry-run), ничего не записано' : 'Применено'}:`,
      `обновлено ${report.updated.length}, пропущено ${report.skipped.length}, ошибок ${report.errors.length}`,
      ...report.skipped.map((line) => `  пропущено: ${line}`),
      ...report.errors.map((line) => `  ошибка: ${line}`),
    ].join('\n'),
  );
  if (report.errors.length) process.exit(1);
}

async function applyKind(
  prisma: PrismaService,
  kind: Kind,
  entries: GuideEntry[],
  dryRun: boolean,
  report: Report,
) {
  const label = (entry: GuideEntry) => `${kind} #${entry.id}`;
  const valid = entries.filter((entry) => {
    const errors = guideErrors(entry);
    if (errors.length) report.errors.push(`${label(entry)}: ${errors.join(', ')}`);
    return !errors.length;
  });

  // Сверка до скачивания картинок: файлы для уже изменённых записей не качаем зря
  const where = {
    OR: valid.map((entry) => ({
      id: entry.id,
      updatedAt: new Date(entry.updatedAt),
    })),
  };
  const fresh = new Set(
    valid.length
      ? (kind === 'exercise'
          ? await prisma.exercise.findMany({ where, select: { id: true } })
          : await prisma.stretch.findMany({ where, select: { id: true } })
        ).map((row) => row.id)
      : [],
  );

  for (const entry of valid) {
    if (!fresh.has(entry.id)) {
      report.skipped.push(`${label(entry)} — изменена после экспорта`);
      continue;
    }
    if (dryRun) {
      report.updated.push(label(entry));
      continue;
    }
    let imageEndPath: string | undefined;
    try {
      // Сеть — до записи в базу, как у импорта справочника
      if (entry.imageEnd) imageEndPath = await resolveCatalogImage(entry.imageEnd);
    } catch (error) {
      logger.warn(
        `Фото финиша не скачалось, ${label(entry)}: ${(error as Error).message}`,
      );
    }
    const data = {
      steps: entry.steps,
      mistakes: entry.mistakes,
      ...(imageEndPath && { imageEndPath }),
    };
    const match = { id: entry.id, updatedAt: new Date(entry.updatedAt) };
    const { count } =
      kind === 'exercise'
        ? await prisma.exercise.updateMany({
            where: match,
            data: { ...data, technique: entry.description },
          })
        : await prisma.stretch.updateMany({
            where: match,
            data: {
              ...data,
              howTo: entry.description,
              ...(entry.feel !== undefined && { feel: entry.feel || null }),
              ...(entry.position && { position: entry.position }),
              ...(entry.techniqueSources && {
                techniqueSources: entry.techniqueSources,
              }),
            },
          });
    if (count) {
      logger.log(`Техника обновлена: ${label(entry)}`);
      report.updated.push(label(entry));
    } else {
      logger.warn(`Запись изменилась во время применения: ${label(entry)}`);
      report.skipped.push(`${label(entry)} — изменена во время применения`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
