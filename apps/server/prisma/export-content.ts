// Снимок справочника из БД: упражнения и растяжки (status CATALOG) с id и updatedAt для
// content:enrich / content:apply-guides, а теги и шаблоны программ — в формате импорта, чтобы их
// можно было скопировать в патч как есть. Запуск на сервере из apps/server:
// yarn content:export [путь/к/export.json]. updatedAt — защита от затирания записей,
// которые поправили после экспорта.
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
    const groups = await prisma.programTagGroup.findMany({
      orderBy: { position: 'asc' },
    });
    const tags = await prisma.programTag.findMany({
      where: { isApproved: true },
      orderBy: { position: 'asc' },
      include: { group: { select: { code: true } } },
    });
    const templates = await prisma.program.findMany({
      where: { isTemplate: true, code: { not: null } },
      orderBy: { position: 'asc' },
      include: {
        tags: { select: { code: true } },
        complexes: {
          orderBy: { position: 'asc' },
          include: {
            exercises: {
              orderBy: { position: 'asc' },
              include: { exercise: { select: { code: true, id: true } } },
            },
          },
        },
      },
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
        measure: e.measure,
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
        kind: s.kind,
        position: s.position,
        feel: s.feel,
        videoUrl: s.videoUrl,
        imageSource: s.imageSource,
        imageLicense: s.imageLicense,
        imageAuthor: s.imageAuthor,
        techniqueSources: s.techniqueSources,
        muscles: s.muscles.map((m) => m.muscle.code),
      })),
      programTagGroups: groups.map((g) => ({
        code: g.code,
        name: g.name,
        position: g.position,
      })),
      programTags: tags.map((t) => ({
        code: t.code,
        name: t.name,
        group: t.group.code,
        position: t.position,
      })),
      programs: templates.map((p) => ({
        code: p.code,
        name: p.name,
        description: p.description ?? '',
        tags: p.tags.map((t) => t.code),
        published: p.isPublished,
        complexes: p.complexes.map((c) => ({
          name: c.name,
          ...(c.warmupMinutes !== null ? { warmupMinutes: c.warmupMinutes } : {}),
          // Старый кардио-блок: импорт его не принимает — перенеси упражнением на время
          ...(c.cardioName
            ? { legacyCardio: `${c.cardioName}, ${c.cardioMinutes} мин` }
            : {}),
          exercises: c.exercises.map((e) => ({
            // Черновик без code в шаблоне импортом не повторить — помечаем id, чтобы было видно
            code: e.exercise.code ?? `#${e.exercise.id}`,
            sets: e.sets,
            repsMin: e.repsMin,
            repsMax: e.repsMax,
            ...(e.superset ? { superset: e.superset } : {}),
          })),
        })),
      })),
    };
    fs.writeFileSync(out, `${JSON.stringify(file, null, 2)}\n`);
    console.log(
      `Экспорт: упражнений ${file.exercises.length}, растяжек ${file.stretches.length}, шаблонов ${file.programs.length} → ${out}`,
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
