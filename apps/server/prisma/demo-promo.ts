// Демо-данные для промо-скринов Mini App. Только локальная база разработки!
// Пользователь — dev-логин ?devUser=777001: сначала пройти онбординг в браузере (программа «Тяни — толкай — ноги»,
// дни Вт/Чт/Сб), потом: npx ts-node -r tsconfig-paths/register prisma/demo-promo.ts
// Перезапуск пересоздаёт историю демо-пользователя и его друзей, чужих данных не трогает.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

if (process.env.NODE_ENV === 'production') throw new Error('Только для локальной базы');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const DEMO_TG = '777001';
const FRIENDS = [
  { tg: '777002', name: 'Аня', trainedToday: true },
  { tg: '777003', name: 'Дима', trainedToday: true },
  { tg: '777004', name: 'Марина', trainedToday: false },
];
const TODAY = new Date('2026-10-20T00:00:00Z');
const FIRST = new Date('2026-08-04T00:00:00Z');
const MISSED = ['2026-09-03'];

// Стартовый вес и шаг прибавки раз в две недели, кг
const PROGRESSION: Record<string, [number, number]> = {
  'Становая тяга': [100, 5],
  'Тяга верхнего блока к груди': [50, 2.5],
  'Тяга нижнего блока сидя': [50, 2.5],
  'Тяга каната к лицу': [20, 1.25],
  Молотки: [12, 1],
  'Подъём гантелей на бицепс': [10, 1],
  'Жим штанги лёжа': [70, 2.5],
  'Жим штанги стоя': [40, 1.25],
  'Жим гантелей на наклонной скамье': [22, 1],
  'Разгибание рук на блоке': [20, 1.25],
  'Махи гантелями в стороны': [8, 0.5],
  'Разгибание гантели из-за головы': [14, 1],
  'Махи гантелями в стороны сидя': [7, 0.5],
  'Приседания со штангой': [80, 5],
  'Румынская тяга': [70, 2.5],
  'Жим ногами': [140, 10],
  'Сгибание ног в тренажёре': [35, 2.5],
  'Подъём на носки стоя': [60, 5],
};

const day = (d: Date, plus: number) => new Date(d.getTime() + plus * 86400000);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const round = (v: number, step: number) => Math.round(v / step) * step;

async function main() {
  const demo = await prisma.user.findUniqueOrThrow({
    where: { telegramId: DEMO_TG },
    include: { sportProfile: true },
  });
  const programId = demo.sportProfile?.activeProgramId;
  if (!programId) throw new Error('Сначала пройди онбординг демо-пользователем');
  const complexes = await prisma.complex.findMany({
    where: { programId },
    orderBy: { position: 'asc' },
    include: { exercises: { orderBy: { position: 'asc' }, include: { exercise: true } } },
  });

  await prisma.planDay.deleteMany({ where: { userId: demo.id } });
  await prisma.workout.deleteMany({ where: { userId: demo.id } });
  await prisma.bodyWeight.deleteMany({ where: { userId: demo.id } });

  // ── История: Вт/Чт/Сб, начиная с «Ноги», чтобы сегодня по очереди снова были ноги ──
  let queue = 2;
  let run = 0;
  let best = 0;
  let count = 0;
  for (let d = FIRST; d < TODAY; d = day(d, 1)) {
    if (![2, 4, 6].includes(d.getUTCDay())) continue;
    if (MISSED.includes(iso(d))) {
      await prisma.planDay.create({
        data: { userId: demo.id, date: d, status: 'MISSED', morningAnswer: 'NO', eveningAnswer: 'NO' },
      });
      run = 0;
      continue;
    }
    const complex = complexes[queue % complexes.length];
    queue++;
    const weeks = Math.floor((d.getTime() - FIRST.getTime()) / (14 * 86400000));
    const start = new Date(`${iso(d)}T16:${String(5 + (count % 5) * 7).padStart(2, '0')}:00Z`);
    let t = start.getTime() + 10 * 60000;
    const workout = await prisma.workout.create({
      data: {
        userId: demo.id,
        complexId: complex.id,
        complexName: complex.name,
        date: d,
        mode: 'DETAILED',
        status: 'FINISHED',
        startedAt: start,
        warmupMinutes: 10,
        warmupFinishedAt: new Date(start.getTime() + 10 * 60000),
      },
    });
    for (const ce of complex.exercises) {
      const [base, stepKg] = PROGRESSION[ce.exercise.name] ?? [20, 1];
      const weight = ce.exercise.equipment === 'BODYWEIGHT' ? 0 : round(base + stepKg * weeks, stepKg >= 1 ? 0.5 : 0.25);
      const we = await prisma.workoutExercise.create({
        data: {
          workoutId: workout.id,
          exerciseId: ce.exerciseId,
          position: ce.position,
          done: true,
          plannedSets: ce.sets,
          repsMin: ce.repsMin,
          repsMax: ce.repsMax,
        },
      });
      for (let n = 1; n <= ce.sets; n++) {
        // Внутри двухнедельного цикла повторы растут от нижней границы диапазона к верхней
        const reps = Math.min(ce.repsMax, ce.repsMin + ((count + n) % 3 === 0 ? 1 : 0) + (weeks % 2) * 2 - (n > 2 ? 1 : 0));
        t += 45000;
        await prisma.workoutSet.create({
          data: {
            workoutExerciseId: we.id,
            number: n,
            weight,
            reps: Math.max(ce.repsMin, reps),
            doneAt: new Date(t),
            workSeconds: 40,
            restTargetSeconds: 90,
          },
        });
        t += 90000;
      }
    }
    await prisma.workout.update({ where: { id: workout.id }, data: { finishedAt: new Date(t + 60000) } });
    await prisma.planDay.create({
      data: {
        userId: demo.id,
        date: d,
        status: 'DONE',
        morningAnswer: 'YES',
        eveningAnswer: 'YES',
        suggestedComplexId: complex.id,
        workoutId: workout.id,
      },
    });
    count++;
    run++;
    best = Math.max(best, run);
  }

  // Вес тела раз в неделю: плавно вниз
  for (let w = 0; w < 11; w++) {
    await prisma.bodyWeight.create({
      data: { userId: demo.id, date: day(FIRST, w * 7 - 1), value: 84.2 - w * 0.35 - (w % 2) * 0.2 },
    });
  }

  await prisma.user.update({ where: { id: demo.id }, data: { name: 'Артём' } });
  await prisma.sportProfile.update({
    where: { userId: demo.id },
    data: {
      displayName: 'Артём',
      currentStreak: run,
      bestStreak: best,
      missedInRow: 0,
      nextComplexId: complexes[queue % complexes.length].id,
      weightAskFrequency: 'WEEKLY',
    },
  });

  // ── Друзья: двое сегодня уже потренировались ──
  for (const f of FRIENDS) {
    const user = await prisma.user.upsert({
      where: { telegramId: f.tg },
      update: { name: f.name },
      create: {
        telegramId: f.tg,
        name: f.name,
        telegramData: { id: Number(f.tg), first_name: f.name },
      },
    });
    await prisma.sportProfile.upsert({
      where: { userId: user.id },
      update: { displayName: f.name },
      create: { userId: user.id, displayName: f.name, trainingDays: [1, 2, 4], onboardedAt: new Date() },
    });
    await prisma.workout.deleteMany({ where: { userId: user.id } });
    if (f.trainedToday) {
      await prisma.workout.create({
        data: {
          userId: user.id,
          complexName: 'Фулбоди',
          date: TODAY,
          mode: 'SIMPLE',
          status: 'FINISHED',
          startedAt: new Date('2026-10-20T06:30:00Z'),
          finishedAt: new Date('2026-10-20T07:30:00Z'),
        },
      });
    }
    const [a, b] = demo.id < user.id ? [demo.id, user.id] : [user.id, demo.id];
    await prisma.friendship.upsert({
      where: { userAId_userBId: { userAId: a, userBId: b } },
      update: {},
      create: { userAId: a, userBId: b },
    });
  }

  console.log(`Готово: тренировок ${count}, серия ${run}, рекорд серии ${best}, сегодня — ${complexes[queue % complexes.length].name}`);
}

main().finally(() => prisma.$disconnect());
