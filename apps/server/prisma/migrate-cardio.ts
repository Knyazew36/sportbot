// Разовый перенос старого кардио-блока комплекса (cardioName/cardioMinutes) в строку упражнения
// на время в конце комплекса. Касается и программ пользователей, и шаблонов. Снимки в прошедших
// тренировках не трогаются — это история. Запуск из apps/server после импорта кардио-упражнений:
//   yarn content:migrate-cardio [--dry-run]
// Название, которое не распознали, остаётся как было и попадает в отчёт — его правят руками.
import 'dotenv/config';
import { Logger } from '@nestjs/common';

import { normalizeName } from '../src/catalog/catalog.service';

import { PrismaService } from './prisma.service';

const logger = new Logger('🏃 MigrateCardio');

/** Признак в названии → код упражнения. Порядок важен: «ходьба на дорожке» раньше «дорожки». */
const RULES: [RegExp, string][] = [
  [/скакал/, 'jump-rope'],
  [/эллипс|орбитрек/, 'elliptical'],
  [/греб/, 'rowing-machine'],
  [/степпер|лестниц|stair/, 'stair-climber'],
  [/горизонтальн\S* вел|recumbent/, 'recumbent-bike'],
  [/вел/, 'stationary-bike'],
  [/ходьб|шаг/, 'treadmill-walk'],
  [/трусц/, 'treadmill-jog'],
  [/бег|дорожк/, 'treadmill-run'],
];

export const cardioCode = (name: string): string | null =>
  RULES.find(([rule]) => rule.test(normalizeName(name)))?.[1] ?? null;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaService();
  try {
    const exercises = new Map(
      (
        await prisma.exercise.findMany({
          where: { code: { in: RULES.map(([, code]) => code) } },
          select: { id: true, code: true },
        })
      ).map((e) => [e.code as string, e.id]),
    );
    const missing = RULES.map(([, code]) => code).filter(
      (code) => !exercises.has(code),
    );
    if (missing.length)
      throw new Error(
        `Нет кардио-упражнений ${missing.join(', ')} — сначала импортируй патч меры`,
      );

    const complexes = await prisma.complex.findMany({
      where: { cardioName: { not: null } },
      select: {
        id: true,
        programId: true,
        cardioName: true,
        cardioMinutes: true,
        exercises: { select: { position: true, exerciseId: true } },
      },
    });
    const unknown: string[] = [];
    let moved = 0;
    for (const complex of complexes) {
      const code = cardioCode(complex.cardioName!);
      const exerciseId = code ? exercises.get(code) : undefined;
      if (!exerciseId) {
        unknown.push(`complexId=${complex.id}: «${complex.cardioName}»`);
        continue;
      }
      const seconds = Math.max(1, complex.cardioMinutes ?? 1) * 60;
      moved++;
      if (dryRun) continue;
      await prisma.$transaction(async (tx) => {
        // То же упражнение уже стоит в комплексе — второй строкой его не добавить, хватит очистить блок
        if (!complex.exercises.some((e) => e.exerciseId === exerciseId))
          await tx.complexExercise.create({
            data: {
              complexId: complex.id,
              exerciseId,
              position:
                Math.max(0, ...complex.exercises.map((e) => e.position)) + 1,
              sets: 1,
              repsMin: seconds,
              repsMax: seconds,
            },
          });
        await tx.complex.update({
          where: { id: complex.id },
          data: { cardioName: null, cardioMinutes: null },
        });
        await tx.program.update({
          where: { id: complex.programId },
          data: { contentUpdatedAt: new Date() },
        });
      });
      logger.log(
        `Кардио перенесено: complexId=${complex.id}, «${complex.cardioName}» → ${code}, ${seconds} с`,
      );
    }
    console.log(
      [
        `${dryRun ? 'Проверка (--dry-run), ничего не записано' : 'Готово'}: комплексов с кардио ${complexes.length}, перенесено ${moved}, не распознано ${unknown.length}`,
        ...unknown.map((line) => `  не распознано: ${line}`),
      ].join('\n'),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
