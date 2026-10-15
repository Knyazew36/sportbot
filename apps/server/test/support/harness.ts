import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { PrismaService } from 'prisma/prisma.service';

import { BotSender } from '@/bot/bot-sender.service';
import { SportAccountService } from '@/bot/sport-account.service';
import { BodyWeightService } from '@/body-weight/body-weight.service';
import { DayService } from '@/day/day.service';
import { LimitationService } from '@/limitation/limitation.service';
import { PauseService } from '@/pause/pause.service';
import { PlanCronService } from '@/plan/plan-cron.service';
import { PlanDayService } from '@/plan/plan-day.service';
import { PollService } from '@/plan/poll.service';
import { ProgramService } from '@/program/program.service';
import { StatsAppService } from '@/stats/stats-app.service';
import { StatsService } from '@/stats/stats.service';
import { CooldownService } from '@/workout/cooldown.service';
import { WorkoutService } from '@/workout/workout.service';

import { installClock, uninstallClock } from './clock';
import { FakeSender } from './fake-sender';

export interface Harness {
  module: TestingModule;
  prisma: PrismaService;
  sender: FakeSender;
  planDays: PlanDayService;
  polls: PollService;
  workouts: WorkoutService;
  programs: ProgramService;
  pauses: PauseService;
  cron: PlanCronService;
  day: DayService;
  stats: StatsAppService;
}

/** Настоящие сервисы дней плана, тренировок, пауз и статистики; мессенджер — заглушка. */
export async function createHarness(): Promise<Harness> {
  Logger.overrideLogger(['error']);
  const sender = new FakeSender();
  const module = await Test.createTestingModule({
    providers: [
      PrismaService,
      SportAccountService,
      PlanDayService,
      PollService,
      WorkoutService,
      CooldownService,
      LimitationService,
      ProgramService,
      PauseService,
      PlanCronService,
      BodyWeightService,
      StatsService,
      StatsAppService,
      DayService,
      { provide: BotSender, useValue: sender },
    ],
  }).compile();

  return {
    module,
    prisma: module.get(PrismaService),
    sender,
    planDays: module.get(PlanDayService),
    polls: module.get(PollService),
    workouts: module.get(WorkoutService),
    programs: module.get(ProgramService),
    pauses: module.get(PauseService),
    cron: module.get(PlanCronService),
    day: module.get(DayService),
    stats: module.get(StatsAppService),
  };
}

/** Пустая база перед каждым тестом: все таблицы, кроме журнала миграций. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (!tables.length) return;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
}

export async function closeHarness(h: Harness): Promise<void> {
  await h.module.close();
  await h.prisma.$disconnect();
}

/**
 * Общий жизненный цикл файла тестов: один модуль на файл, пустая база и чистые сообщения перед
 * каждым тестом, подменённые часы. Возвращает геттер — модуль появляется только в beforeAll.
 */
export function useHarness(): () => Harness {
  let h: Harness | undefined;
  beforeAll(async () => {
    installClock();
    h = await createHarness();
  });
  beforeEach(async () => {
    await resetDatabase(h!.prisma);
    h!.sender.clear();
  });
  afterAll(async () => {
    if (h) await closeHarness(h);
    uninstallClock();
  });
  return () => h!;
}
