// Загрузка стартового справочника и шаблонов без бота: тот же файл и та же проверка, что у импорта
// администратора (раздел 30.2 ТЗ). Запуск из apps/server: npm run content:import [-- путь/к/файлу.json]
// Флаг --no-images пропускает скачивание картинок: поле image из файла не читается,
// уже привязанные к записям картинки остаются как были.
// Флаг --dry-run только проверяет файл и печатает отчёт: в базу ничего не пишется.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import { ImportService } from '../src/admin/import.service';

import { PrismaService } from './prisma.service';

async function main() {
  const args = process.argv.slice(2);
  const noImages = args.includes('--no-images');
  const dryRun = args.includes('--dry-run');
  const file = path.resolve(
    args.find((arg) => !arg.startsWith('--')) ??
      path.join(__dirname, 'content', 'catalog.json'),
  );
  const source = fs.readFileSync(file, 'utf-8');
  const raw = noImages ? withoutImages(source) : source;
  const prisma = new PrismaService();
  const imports = new ImportService(prisma);
  try {
    const { report } = await imports.check(raw);
    console.log(imports.reportText(report));
    if (report.errors.length) process.exit(1);
    if (dryRun) {
      console.log(`Проверка (--dry-run), ничего не записано: ${file}`);
      return;
    }
    await imports.apply(raw);
    console.log(`Импорт применён: ${file}${noImages ? ' (без картинок)' : ''}`);
  } finally {
    await prisma.$disconnect();
  }
}

/** Тот же файл без поля image у упражнений и растяжек. */
function withoutImages(source: string): string {
  const json = JSON.parse(
    source.charCodeAt(0) === 0xfeff ? source.slice(1) : source,
  ) as Record<string, unknown>;
  for (const section of ['exercises', 'stretches']) {
    const items = json[section];
    if (!Array.isArray(items)) continue;
    for (const item of items as Record<string, unknown>[]) {
      delete item?.image;
      delete item?.imageEnd;
    }
  }
  return JSON.stringify(json);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
