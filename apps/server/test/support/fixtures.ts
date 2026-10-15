import { PrismaService } from 'prisma/prisma.service';

import { SportProfile } from '@/generated/prisma/client';

import { day } from './clock';

export interface Athlete {
  userId: number;
  complexIds: number[];
}

export interface AthleteOptions {
  timeZone?: string;
  /** 0 — воскресенье. По умолчанию Пн/Ср/Пт. */
  trainingDays?: number[];
  morningTime?: string;
  eveningTime?: string;
  /** Момент окончания онбординга; по умолчанию — давно, чтобы не влиять на утренний вопрос. */
  onboardedAt?: Date;
}

let seq = 0;

/** Пользователь с пройденным онбордингом и активной программой из двух комплексов. */
export async function createAthlete(
  prisma: PrismaService,
  options: AthleteOptions = {},
): Promise<Athlete> {
  seq++;
  const user = await prisma.user.create({
    data: { name: `Тест ${seq}`, telegramId: `tg-${seq}` },
  });
  const exercise = await prisma.exercise.create({
    data: { name: `Жим ${seq}`, nameNormalized: `жим ${seq}` },
  });
  const program = await prisma.program.create({
    data: {
      name: 'Программа',
      ownerId: user.id,
      complexes: {
        create: ['А', 'Б'].map((name, position) => ({
          name,
          position,
          exercises: {
            create: [
              {
                exerciseId: exercise.id,
                position: 0,
                sets: 3,
                repsMin: 8,
                repsMax: 12,
              },
            ],
          },
        })),
      },
    },
    include: { complexes: { orderBy: { position: 'asc' } } },
  });
  const complexIds = program.complexes.map((c) => c.id);
  await prisma.sportProfile.create({
    data: {
      userId: user.id,
      displayName: user.name!,
      timeZone: options.timeZone ?? 'Europe/Moscow',
      trainingDays: options.trainingDays ?? [1, 3, 5],
      morningTime: options.morningTime ?? '08:00',
      eveningTime: options.eveningTime ?? '20:00',
      onboardingStep: 3,
      onboardedAt: options.onboardedAt ?? new Date('2026-01-01T00:00:00Z'),
      activeProgramId: program.id,
      nextComplexId: complexIds[0],
    },
  });
  return { userId: user.id, complexIds };
}

export function profileOf(
  prisma: PrismaService,
  userId: number,
): Promise<SportProfile> {
  return prisma.sportProfile.findUniqueOrThrow({ where: { userId } });
}

/** День плана напрямую в базе — для состояний, до которых долго идти через сервисы. */
export function seedPlanDay(
  prisma: PrismaService,
  userId: number,
  date: string,
  data: {
    status?: 'PENDING' | 'DONE' | 'MISSED' | 'PAUSED';
    type?: 'PLANNED' | 'RESCHEDULED';
  } = {},
) {
  return prisma.planDay.create({
    data: { userId, date: day(date), ...data },
  });
}
