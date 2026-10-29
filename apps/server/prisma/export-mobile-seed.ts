// Снимок справочника для сборки мобилки: тот же ответ, что GET sync/catalog, но только
// опубликованное (status CATALOG) — без чьих-то черновиков. Картинок в снимке нет, только url:
// они докачиваются после входа. Запуск на сервере из apps/server:
// yarn content:mobile-seed [путь/к/catalog-seed.json]
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import { loadSyncCatalog } from '@/sync/sync-catalog.query';

import { PrismaService } from './prisma.service';

// Как UploadService.toPublicUrl: телефон сам приставит адрес сервера
const toUrl = (relativePath: string | null) =>
  relativePath ? `/uploads/${relativePath}` : null;

async function main() {
  const out = path.resolve(process.argv[2] ?? 'catalog-seed.json');
  const prisma = new PrismaService();
  try {
    const seed = await loadSyncCatalog(prisma, {
      visibleExercises: { status: 'CATALOG' },
      visibleStretches: { status: 'CATALOG' },
      toUrl,
    });
    fs.writeFileSync(out, JSON.stringify(seed));
    console.log(
      `Снимок для мобилки: мышц=${seed.muscles.length}, упражнений=${seed.exercises.length}, растяжек=${seed.stretches.length}, шаблонов=${seed.templates.length} → ${out}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
