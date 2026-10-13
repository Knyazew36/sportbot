import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { STRETCH_INCLUDE, StretchFull } from '@/catalog/catalog.service';
import { Prisma } from '@/generated/prisma/client';

type Tx = Prisma.TransactionClient;

export interface CooldownView {
  main: StretchFull[];
  optional: StretchFull[];
  /** Суммарное время, округлённое вверх до минут. */
  minutes: number;
}

const minOrder = (stretch: StretchFull): number =>
  Math.min(...stretch.muscles.map((m) => m.muscle.bodyOrder));

/** Заминка: набор растяжек под конкретную тренировку (раздел 25.7 ТЗ). */
@Injectable()
export class CooldownService {
  private readonly logger = new Logger(`🧘 ${CooldownService.name}`);

  constructor(private readonly prisma: PrismaService) {}

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
        exercise: {
          select: { muscles: { select: { role: true, muscle: true } } },
        },
      },
    });
    const muscles = exercises.flatMap((item) => item.exercise.muscles);
    const byOrder = (a: { bodyOrder: number }, b: { bodyOrder: number }) =>
      a.bodyOrder - b.bodyOrder;
    const unique = <T extends { id: number }>(items: T[]) => [
      ...new Map(items.map((item) => [item.id, item])).values(),
    ];
    const primary = unique(
      muscles.filter((m) => m.role === 'PRIMARY').map((m) => m.muscle),
    ).sort(byOrder);
    const primaryIds = new Set(primary.map((m) => m.id));
    const secondary = unique(
      muscles
        .filter((m) => m.role === 'SECONDARY' && !primaryIds.has(m.muscle.id))
        .map((m) => m.muscle),
    ).sort(byOrder);

    const candidates = await tx.stretch.findMany({
      where: {
        kind: 'COOLDOWN',
        OR: [{ status: 'CATALOG' }, { status: 'DRAFT', authorId: userId }],
      },
      include: STRETCH_INCLUDE,
    });

    const covered = new Set<number>();
    const chosen = new Set<number>();
    const pick = (wanted: typeof primary): StretchFull[] => {
      const block: StretchFull[] = [];
      for (const muscle of wanted) {
        // Растяжка, взятая раньше, уже закрыла эту мышцу — вторая на неё не добавляется
        if (covered.has(muscle.id)) continue;
        const options = candidates.filter(
          (s) =>
            !chosen.has(s.id) &&
            s.muscles.some((m) => m.muscleId === muscle.id),
        );
        if (!options.length) {
          this.logger.warn(
            `Нет растяжки на мышцу ${muscle.code}: workoutId=${workoutId}`,
          );
          continue;
        }
        const stretch = options[Math.floor(Math.random() * options.length)];
        chosen.add(stretch.id);
        for (const m of stretch.muscles) covered.add(m.muscleId);
        block.push(stretch);
      }
      return block.sort((a, b) => minOrder(a) - minOrder(b));
    };

    const main = pick(primary);
    const optional = pick(secondary);

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
      `Заминка собрана: workoutId=${workoutId}, основных=${main.length}, доп=${optional.length}`,
    );
    return this.view(main, optional);
  }

  private view(main: StretchFull[], optional: StretchFull[]): CooldownView {
    const seconds = [...main, ...optional].reduce(
      (sum, s) => sum + s.holdSeconds * (s.perSide ? 2 : 1),
      0,
    );
    return { main, optional, minutes: Math.ceil(seconds / 60) };
  }
}
