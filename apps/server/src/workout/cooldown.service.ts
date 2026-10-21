import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { STRETCH_INCLUDE, StretchFull } from '@/catalog/catalog.service';
import {
  Muscle,
  MuscleRole,
  Prisma,
  StretchPosition,
} from '@/generated/prisma/client';
import { StretchExclusionService } from '@/stretch-exclusion/stretch-exclusion.service';

type Tx = Prisma.TransactionClient;

export interface CooldownView {
  main: StretchFull[];
  optional: StretchFull[];
  /** Суммарное время, округлённое вверх до минут. */
  minutes: number;
}

/**
 * Бюджет заминки: статика по 30 с на мышцу, всего 5–10 минут.
 * Основной блок — от 5 до 7 минут, «если есть время» — ещё до 3.
 */
const MAIN_BUDGET_SECONDS = 7 * 60;
/** Короче 5 минут основной блок не бывает: добирается второй растяжкой на те же мышцы. */
const MAIN_MIN_SECONDS = 5 * 60;
const OPTIONAL_BUDGET_SECONDS = 3 * 60;
/** Перейти в новое положение и найти опору. */
const TRANSITION_SECONDS = 10;

/** Стоя → на коленях → сидя → лёжа: без лишних «встал-лёг-встал». Без положения — в конец. */
const POSITION_ORDER: Record<StretchPosition, number> = {
  STANDING: 0,
  KNEELING: 1,
  SITTING: 2,
  LYING: 3,
};

const minOrder = (stretch: StretchFull): number =>
  Math.min(...stretch.muscles.map((m) => m.muscle.bodyOrder));

const positionOrder = (stretch: StretchFull): number =>
  stretch.position ? POSITION_ORDER[stretch.position] : 4;

const byFlow = (a: StretchFull, b: StretchFull): number =>
  positionOrder(a) - positionOrder(b) || minOrder(a) - minOrder(b);

const stretchSeconds = (stretch: StretchFull): number =>
  stretch.holdSeconds * (stretch.perSide ? 2 : 1);

type WorkoutMuscles = {
  plannedSets: number;
  exercise: { muscles: { role: MuscleRole; muscle: Muscle }[] };
}[];

/** Мышцы роли по объёму тренировки (сумма подходов), при равенстве — сверху вниз по телу. */
const rankMuscles = (exercises: WorkoutMuscles, role: MuscleRole): Muscle[] => {
  const volume = new Map<number, { muscle: Muscle; sets: number }>();
  for (const item of exercises)
    for (const m of item.exercise.muscles) {
      if (m.role !== role) continue;
      const entry = volume.get(m.muscle.id) ?? { muscle: m.muscle, sets: 0 };
      entry.sets += item.plannedSets;
      volume.set(m.muscle.id, entry);
    }
  return [...volume.values()]
    .sort((a, b) => b.sets - a.sets || a.muscle.bodyOrder - b.muscle.bodyOrder)
    .map((v) => v.muscle);
};

/** Заминка: набор растяжек под конкретную тренировку (раздел 25.7 ТЗ). */
@Injectable()
export class CooldownService {
  private readonly logger = new Logger(`🧘 ${CooldownService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly exclusions: StretchExclusionService,
  ) {}

  // ── Сборка ──────────────────────────────────────────────────────────────

  /**
   * Заминка тренировки. Набор выбирается один раз и сохраняется: повторный вызов читает сохранённое.
   * onlyDone — учитывать только сделанные упражнения (досрочное завершение детальной тренировки).
   */
  public async build(
    workoutId: number,
    userId: number,
    onlyDone: boolean,
    tx: Tx = this.prisma,
  ): Promise<CooldownView> {
    const saved = await tx.workoutStretch.findMany({
      where: { workoutId },
      orderBy: { position: 'asc' },
      include: { stretch: { include: STRETCH_INCLUDE } },
    });
    if (saved.length)
      return this.view(
        saved.filter((s) => s.block === 'MAIN').map((s) => s.stretch),
        saved.filter((s) => s.block === 'OPTIONAL').map((s) => s.stretch),
      );

    const exercises = await tx.workoutExercise.findMany({
      where: { workoutId, ...(onlyDone ? { done: true } : {}) },
      select: {
        plannedSets: true,
        exercise: {
          select: { muscles: { select: { role: true, muscle: true } } },
        },
      },
    });
    const primary = rankMuscles(exercises, 'PRIMARY');
    const primaryIds = new Set(primary.map((m) => m.id));
    const secondary = rankMuscles(exercises, 'SECONDARY').filter(
      (m) => !primaryIds.has(m.id),
    );

    const [candidates, last] = await Promise.all([
      tx.stretch.findMany({
        where: this.candidateWhere(userId),
        include: STRETCH_INCLUDE,
      }),
      // Прошлая заминка: её растяжки уходят в конец очереди, чтобы набор не повторялся
      tx.workout.findFirst({
        where: { userId, id: { not: workoutId }, stretches: { some: {} } },
        orderBy: { id: 'desc' },
        select: { stretches: { select: { stretchId: true } } },
      }),
    ]);
    const recent = new Set(last?.stretches.map((s) => s.stretchId) ?? []);

    const covered = new Set<number>();
    const chosen = new Set<number>();
    const pick = (
      wanted: typeof primary,
      budget: number,
      block: string,
      /** Добирать до этого времени второй и следующими растяжками на те же мышцы. */
      minimum = 0,
      /** Чем добирать, если на основные мышцы растяжки кончились. */
      spare: typeof primary = [],
    ): StretchFull[] => {
      const picked: StretchFull[] = [];
      const wantedIds = new Set(wanted.map((m) => m.id));
      let spent = 0;
      // Добавить растяжку на мышцу; again — мышца уже закрыта, это добор времени
      const take = (muscle: (typeof primary)[number], again: boolean) => {
        const options = candidates.filter(
          (s) =>
            !chosen.has(s.id) &&
            s.muscles.some((m) => m.muscleId === muscle.id),
        );
        if (!options.length) {
          if (!again)
            this.logger.warn(
              `Нет растяжки на мышцу ${muscle.code}: workoutId=${workoutId}`,
            );
          return false;
        }
        const score = (s: StretchFull) =>
          s.muscles.filter(
            (m) =>
              wantedIds.has(m.muscleId) && (again || !covered.has(m.muscleId)),
          ).length *
            2 +
          (s.imagePath ? 1 : 0) +
          (recent.has(s.id) ? 0 : 2);
        const best = Math.max(...options.map(score));
        const top = options.filter((s) => score(s) === best);
        const stretch = top[Math.floor(Math.random() * top.length)];
        const cost = stretchSeconds(stretch) + TRANSITION_SECONDS;
        // Первая растяжка блока берётся всегда, дальше — пока укладываемся во время
        if (picked.length && spent + cost > budget) {
          this.logger.debug(
            `Не влезла в ${block}: мышца ${muscle.code}, workoutId=${workoutId}, занято ${spent} из ${budget} с`,
          );
          return false;
        }
        spent += cost;
        chosen.add(stretch.id);
        for (const m of stretch.muscles) covered.add(m.muscleId);
        picked.push(stretch);
        return true;
      };

      for (const muscle of wanted)
        // Растяжка, взятая раньше, уже закрыла эту мышцу — вторая на неё сразу не добавляется
        if (!covered.has(muscle.id)) take(muscle, false);

      // Мало мышц — заминка вышла бы на 2 минуты. Добираем по кругу: сначала самые нагруженные
      const pool = [...wanted, ...spare];
      while (spent < minimum) {
        let added = false;
        for (const muscle of pool) {
          if (spent >= minimum) break;
          added = take(muscle, true) || added;
        }
        if (!added) break;
      }
      if (minimum && spent < minimum)
        this.logger.warn(
          `${block} короче минимума: ${spent} из ${minimum} с, workoutId=${workoutId}`,
        );
      return picked.sort(byFlow);
    };

    const main = pick(
      primary,
      MAIN_BUDGET_SECONDS,
      'MAIN',
      MAIN_MIN_SECONDS,
      secondary,
    );
    const optional = pick(secondary, OPTIONAL_BUDGET_SECONDS, 'OPTIONAL');

    let position = 0;
    const rows = [
      ...main.map((s) => ({ stretch: s, block: 'MAIN' as const })),
      ...optional.map((s) => ({ stretch: s, block: 'OPTIONAL' as const })),
    ];
    if (rows.length)
      await tx.workoutStretch.createMany({
        data: rows.map((row) => ({
          workoutId,
          stretchId: row.stretch.id,
          block: row.block,
          position: ++position,
        })),
      });
    this.logger.log(
      `Заминка собрана: workoutId=${workoutId}, основных=${main.length}, доп=${optional.length}, повторов с прошлой=${rows.filter((r) => recent.has(r.stretch.id)).length}`,
    );
    return this.view(main, optional);
  }

  // ── Замена ──────────────────────────────────────────────────────────────

  /**
   * «Не предлагать»: растяжка исключается навсегда, а в этой заминке меняется на другую
   * на те же мышцы. Замены нет — растяжка просто убирается из заминки.
   */
  public async exclude(
    workoutId: number,
    userId: number,
    stretchId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.workoutStretch.findFirst({
        where: { workoutId, stretchId, workout: { userId } },
        include: { stretch: { include: STRETCH_INCLUDE } },
      });
      if (!row) throw new NotFoundException('Этой растяжки нет в заминке.');
      await this.exclusions.ensure(userId, stretchId, tx);

      const muscleIds = row.stretch.muscles.map((m) => m.muscleId);
      const taken = await tx.workoutStretch.findMany({
        where: { workoutId },
        select: { stretchId: true },
      });
      const options = await tx.stretch.findMany({
        where: {
          ...this.candidateWhere(userId),
          id: { notIn: taken.map((t) => t.stretchId) },
          muscles: { some: { muscleId: { in: muscleIds } } },
        },
        include: STRETCH_INCLUDE,
      });
      // Лучше та, что закрывает больше мышц убранной; среди равных — случайно
      // Та же поза — плюс: замена не ломает порядок «стоя → лёжа»
      const overlap = (s: StretchFull) =>
        s.muscles.filter((m) => muscleIds.includes(m.muscleId)).length * 2 +
        (s.position === row.stretch.position ? 1 : 0);
      const best = Math.max(0, ...options.map(overlap));
      const top = options.filter((s) => overlap(s) === best);
      const next = top[Math.floor(Math.random() * top.length)];

      if (next) {
        await tx.workoutStretch.update({
          where: { id: row.id },
          data: { stretchId: next.id },
        });
        this.logger.log(
          `Растяжка заменена: workoutId=${workoutId}, userId=${userId}, было=${stretchId}, стало=${next.id}`,
        );
        return;
      }
      await tx.workoutStretch.delete({ where: { id: row.id } });
      this.logger.warn(
        `Замены нет, растяжка убрана: workoutId=${workoutId}, userId=${userId}, stretchId=${stretchId}`,
      );
    });
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Растяжки, которые можно предложить человеку: из справочника или свои, кроме исключённых. */
  private candidateWhere(userId: number): Prisma.StretchWhereInput {
    return {
      kind: 'COOLDOWN',
      OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
      exclusions: { none: { userId } },
    };
  }

  private view(main: StretchFull[], optional: StretchFull[]): CooldownView {
    const seconds = [...main, ...optional].reduce(
      (sum, s) => sum + stretchSeconds(s),
      0,
    );
    return { main, optional, minutes: Math.ceil(seconds / 60) };
  }
}
