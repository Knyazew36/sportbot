// Загрузка стартового справочника и шаблонов без бота: тот же файл и та же проверка, что у импорта
// администратора (раздел 30.2 ТЗ). Запуск из apps/server: npm run content:import [-- путь/к/файлу.json]
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import { ImportService } from '../src/admin/import.service';

import { PrismaService } from './prisma.service';

async function main() {
  const file = path.resolve(
    process.argv[2] ?? path.join(__dirname, 'content', 'catalog.json'),
  );
  const raw = fs.readFileSync(file, 'utf-8');
  const prisma = new PrismaService();
  const imports = new ImportService(prisma);
  try {
    const { report } = await imports.check(raw);
    console.log(imports.reportText(report));
    if (report.errors.length) process.exit(1);
    await imports.apply(raw);
    console.log(`Импорт применён: ${file}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
