// Снимок справочника из БД (status CATALOG) для content:enrich. Запуск на сервере из apps/server:
// yarn content:export [-- путь/к/export.json]. updatedAt в снимке — защита content:apply-guides
// от затирания записей, которые поправили после экспорта.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from './prisma.service';

async function main() {
  const out = path.resolve(process.argv[2] ?? 'catalog-export.json');
  const prisma = new PrismaService();
  try {
    const exercises = await prisma.exercise.findMany({
      where: { status: 'CATALOG' },
      orderBy: { id: 'asc' },
      include: {
        muscles: { include: { muscle: { select: { code: true } } } },
        joints: { include: { joint: { select: { code: true } } } },
      },
    });
    const stretches = await prisma.stretch.findMany({
      where: { status: 'CATALOG' },
      orderBy: { id: 'asc' },
      include: { muscles: { include: { muscle: { select: { code: true } } } } },
    });
    const file = {
      exportedAt: new Date().toISOString(),
      exercises: exercises.map((e) => ({
        id: e.id,
        code: e.code,
        updatedAt: e.updatedAt.toISOString(),
        name: e.name,
        technique: e.technique,
        steps: e.steps,
        mistakes: e.mistakes,
        imagePath: e.imagePath,
        imageEndPath: e.imageEndPath,
        equipment: e.equipment,
        muscles: e.muscles.map((m) => ({ code: m.muscle.code, role: m.role })),
        joints: e.joints.map((j) => j.joint.code),
      })),
      stretches: stretches.map((s) => ({
        id: s.id,
        code: s.code,
        updatedAt: s.updatedAt.toISOString(),
        name: s.name,
        howTo: s.howTo,
        steps: s.steps,
        mistakes: s.mistakes,
        imagePath: s.imagePath,
        imageEndPath: s.imageEndPath,
        holdSeconds: s.holdSeconds,
        perSide: s.perSide,
        muscles: s.muscles.map((m) => m.muscle.code),
      })),
    };
    fs.writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
    console.log(
      `Экспорт: упражнений ${file.exercises.length}, растяжек ${file.stretches.length} → ${out}`,
    );
    console.log('Бэкап картинок: tar czf catalog-uploads.tgz uploads/catalog');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
