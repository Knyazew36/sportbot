import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, appBtn, btn, msg } from '@/bot';
import { CatalogKind, normalizeName } from '@/catalog/catalog.service';
import { guideLines } from '@/catalog/catalog.texts';
import { paginatePrisma } from '@/common/prisma';
import {
  CatalogStatus,
  Equipment,
  ExerciseMeasure,
  ModerationOutcome,
  Prisma,
} from '@/generated/prisma/client';
import { MessengerMessage } from '@/messengers';

type Tx = Prisma.TransactionClient;

export const REQUEST_INCLUDE = {
  author: {
    select: { id: true, sportProfile: { select: { displayName: true } } },
  },
  exercise: { include: { muscles: { include: { muscle: true } } } },
  stretch: { include: { muscles: { include: { muscle: true } } } },
} satisfies Prisma.ModerationRequestInclude;

export type RequestFull = Prisma.ModerationRequestGetPayload<{
  include: typeof REQUEST_INCLUDE;
}>;

const MINE_INCLUDE = {
  moderationRequests: {
    orderBy: { id: 'desc' },
    take: 1,
    select: { outcome: true, reason: true },
  },
} as const;

/** Своя запись для вкладки «Мои»: упражнение и растяжка отдают одни и те же поля. */
export type MineEntry = {
  id: number;
  name: string;
  status: CatalogStatus;
  createdAt: Date;
  moderationRequests: { outcome: ModerationOutcome; reason: string | null }[];
};

export interface DraftInput {
  kind: CatalogKind;
  name: string;
  /** Упражнение: основные мышцы; растяжка: все мышцы, которые она тянет. */
  primary: number[];
  secondary: number[];
  technique?: string;
  steps?: string[];
  mistakes?: string[];
  videoUrl?: string;
  holdSeconds?: number;
  perSide?: boolean;
  /** Картинка из формы приложения. */
  imagePath?: string;
  /** Только упражнение: инвентарь, мера и суставы. */
  equipment?: Equipment;
  measure?: ExerciseMeasure;
  jointIds?: number[];
}

export interface DraftEdits {
  name?: string;
  text?: string;
  imagePath?: string;
  equipment?: Equipment;
  jointIds?: number[];
}

/** Что сообщить автору после решения по заявке. */
export interface Decision {
  authorId: number | null;
  text: string;
}

/** Причина для автора: коротко, без точки в конце — её ставит текст уведомления. */
const cleanReason = (reason?: string): string | undefined =>
  reason
    ?.trim()
    .replace(/[.\s]+$/, '')
    .slice(0, 200) || undefined;

export const OUTCOME_TITLE: Record<ModerationOutcome, string> = {
  PENDING: '⏳ на проверке',
  APPROVED: '✅ в справочнике',
  APPROVED_EDITED: '✅ в справочнике',
  DUPLICATE: '🔗 объединено с записью справочника',
  REJECTED: '📝 осталось личным',
};

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(`🛡 ${ModerationService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Черновик ────────────────────────────────────────────────────────────

  /** Личная запись автора: видна только ему, на модерацию не уходит. */
  public async createDraft(
    userId: number,
    input: DraftInput,
  ): Promise<{ id: number; name: string; createdAt: Date }> {
    const name = input.name.trim().replace(/\s+/g, ' ');
    const common = {
      name,
      nameNormalized: normalizeName(name),
      status: 'DRAFT' as const,
      authorId: userId,
    };
    const select = { id: true, name: true, createdAt: true } as const;
    const entry =
      input.kind === 'exercise'
        ? await this.prisma.exercise.create({
            data: {
              ...common,
              technique: input.technique,
              steps: input.steps,
              mistakes: input.mistakes,
              videoUrl: input.videoUrl,
              imagePath: input.imagePath,
              equipment: input.equipment,
              measure: input.measure,
              joints: {
                create: (input.jointIds ?? []).map((jointId) => ({ jointId })),
              },
              muscles: {
                create: [
                  ...input.primary.map((muscleId) => ({
                    muscleId,
                    role: 'PRIMARY' as const,
                  })),
                  ...input.secondary
                    .filter((id) => !input.primary.includes(id))
                    .map((muscleId) => ({
                      muscleId,
                      role: 'SECONDARY' as const,
                    })),
                ],
              },
            },
            select,
          })
        : await this.prisma.stretch.create({
            data: {
              ...common,
              howTo: input.technique,
              steps: input.steps,
              mistakes: input.mistakes,
              imagePath: input.imagePath,
              holdSeconds: input.holdSeconds ?? 30,
              perSide: input.perSide ?? false,
              muscles: {
                create: input.primary.map((muscleId) => ({ muscleId })),
              },
            },
            select,
          });
    this.logger.log(
      `Черновик создан: ${input.kind}Id=${entry.id}, userId=${userId}`,
    );
    return entry;
  }

  // ── Заявка ──────────────────────────────────────────────────────────────

  /**
   * «Опубликовать»: заявка на свою личную запись. Копии чужих черновиков (originDraftId)
   * не публикуются — их судьбу решает заявка оригинала.
   */
  public async requestPublish(
    userId: number,
    kind: CatalogKind,
    entryId: number,
  ): Promise<RequestFull> {
    const request = await this.prisma.$transaction(async (tx) => {
      const created = await this.createRequests(tx, userId, kind, [entryId]);
      if (!created.length)
        throw new BadRequestException(
          'Запись уже на проверке, в справочнике или не твоя.',
        );
      return created[0];
    });
    this.logger.log(
      `Заявка создана: requestId=${request.id}, userId=${userId}, ${kind}Id=${entryId}`,
    );
    return request;
  }

  /**
   * Свои непроверенные упражнения программы, которая уходит на публикацию: каталог программ
   * не должен показывать записи, которых нет в справочнике. Уже ждущие проверки пропускаются.
   */
  public async requestPublishMany(
    userId: number,
    exerciseIds: number[],
  ): Promise<RequestFull[]> {
    if (!exerciseIds.length) return [];
    const requests = await this.prisma.$transaction((tx) =>
      this.createRequests(tx, userId, 'exercise', exerciseIds),
    );
    if (requests.length)
      this.logger.log(
        `Заявки на упражнения программы: userId=${userId}, requestIds=[${requests.map((r) => r.id).join(',')}]`,
      );
    return requests;
  }

  public async find(requestId: number): Promise<RequestFull> {
    const request = await this.prisma.moderationRequest.findUnique({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });
    if (!request) throw new BadRequestException('Заявка не найдена.');
    return request;
  }

  public async pending(): Promise<RequestFull[]> {
    return this.prisma.moderationRequest.findMany({
      where: { outcome: 'PENDING' },
      orderBy: { id: 'asc' },
      take: 20,
      include: REQUEST_INCLUDE,
    });
  }

  /** Вкладка «Мои» в приложении: свои записи (без копий чужих) с последней заявкой. */
  public async mineList(
    userId: number,
    kind: CatalogKind,
    page?: number,
    limit?: number,
  ) {
    const args = {
      page,
      limit,
      where: { authorId: userId, originDraftId: null },
      orderBy: { id: 'desc' as const },
      include: MINE_INCLUDE,
    };
    const result =
      kind === 'exercise'
        ? await paginatePrisma(this.prisma.exercise, args)
        : await paginatePrisma(this.prisma.stretch, args);
    return {
      items: result.items as unknown as MineEntry[],
      meta: result.meta,
    };
  }

  public async mine(userId: number): Promise<RequestFull[]> {
    return this.prisma.moderationRequest.findMany({
      where: { authorId: userId },
      orderBy: { id: 'desc' },
      take: 10,
      include: REQUEST_INCLUDE,
    });
  }

  /** Сообщение администратору с кнопками исходов. */
  public requestMessage(request: RequestFull): MessengerMessage {
    const author =
      request.author?.sportProfile?.displayName ?? 'удалённого пользователя';
    const lines: string[] = [];
    if (request.exercise) {
      const names = (role: string) =>
        request
          .exercise!.muscles.filter((m) => m.role === role)
          .map((m) => m.muscle.name.toLowerCase())
          .join(', ');
      lines.push(
        `Новая заявка: упражнение «${request.exercise.name}» от ${author}`,
        `Мышцы: ${names('PRIMARY')}${names('SECONDARY') ? `; вспомогательные — ${names('SECONDARY')}` : ''}`,
        `Техника: ${request.exercise.technique || 'не указана'}`,
        ...guideLines(request.exercise),
        `Видео: ${request.exercise.videoUrl || 'нет'}`,
      );
    } else if (request.stretch) {
      lines.push(
        `Новая заявка: растяжка «${request.stretch.name}» от ${author}`,
        `Тянет: ${request.stretch.muscles.map((m) => m.muscle.name.toLowerCase()).join(', ')}`,
        `Удержание: ${request.stretch.holdSeconds} сек${request.stretch.perSide ? ' на сторону' : ''}`,
        `Как делать: ${request.stretch.howTo || 'не указано'}`,
        ...guideLines(request.stretch),
      );
    }
    if (request.outcome !== 'PENDING')
      return msg([...lines, '', 'Заявка уже обработана.'].join('\n'));
    return msg(lines.join('\n'), [
      [
        btn('Одобрить', `md:ok:${request.id}`),
        btn('Одобрить с правками', `md:edit:${request.id}`),
      ],
      [
        btn('Дубль', `md:dup:${request.id}`),
        btn('Отклонить', `md:rej:${request.id}`),
      ],
      [appBtn(APP_SCREEN.request(request.id))],
    ]);
  }

  // ── Исходы ──────────────────────────────────────────────────────────────

  /**
   * Одобрить: черновик становится записью справочника, копии у друзей заменяются на него.
   * edits — «одобрить с правками»: администратор поправил название, дописал технику, картинку, инвентарь, суставы.
   */
  public async approve(
    requestId: number,
    edits?: DraftEdits,
    reason?: string,
  ): Promise<Decision> {
    const outcome: ModerationOutcome = edits ? 'APPROVED_EDITED' : 'APPROVED';
    const note = cleanReason(reason);
    const renamed = edits?.name
      ? { name: edits.name, nameNormalized: normalizeName(edits.name) }
      : {};
    const decision = await this.prisma.$transaction(async (tx) => {
      const request = await this.decide(tx, requestId, outcome, note);
      if (request.exerciseId) {
        const exercise = await tx.exercise.update({
          where: { id: request.exerciseId },
          data: {
            status: 'CATALOG',
            ...renamed,
            ...(edits?.text ? { technique: edits.text } : {}),
            ...(edits?.imagePath
              ? {
                  imagePath: edits.imagePath,
                  imageTelegramFileId: null,
                  imageMaxToken: null,
                }
              : {}),
            ...(edits?.equipment ? { equipment: edits.equipment } : {}),
            ...(edits?.jointIds
              ? {
                  joints: {
                    deleteMany: {},
                    create: edits.jointIds.map((jointId) => ({ jointId })),
                  },
                }
              : {}),
          },
        });
        const copies = await tx.exercise.findMany({
          where: { originDraftId: exercise.id },
          select: { id: true },
        });
        await this.mergeExercises(
          tx,
          copies.map((c) => c.id),
          exercise.id,
        );
        return { authorId: request.authorId, name: exercise.name };
      }
      const stretch = await tx.stretch.update({
        where: { id: request.stretchId! },
        data: {
          status: 'CATALOG',
          ...renamed,
          ...(edits?.text ? { howTo: edits.text } : {}),
          ...(edits?.imagePath
            ? {
                imagePath: edits.imagePath,
                imageTelegramFileId: null,
                imageMaxToken: null,
              }
            : {}),
        },
      });
      return { authorId: request.authorId, name: stretch.name };
    });
    this.logger.log(
      `Заявка одобрена: requestId=${requestId}, исход=${outcome}`,
    );
    return {
      authorId: decision.authorId,
      text: `«${decision.name}» добавлен в общий справочник.${note ? ` ${note}.` : ''}`,
    };
  }

  /**
   * Дубль: черновик и его копии заменяются записью справочника во всех комплексах и тренировках —
   * так переносится история весов. Черновики удаляются.
   */
  public async duplicate(
    requestId: number,
    targetId: number,
    reason?: string,
  ): Promise<Decision> {
    const note = cleanReason(reason);
    const decision = await this.prisma.$transaction(async (tx) => {
      const request = await this.decide(tx, requestId, 'DUPLICATE', note);
      if (request.exerciseId) {
        const draftId = request.exerciseId;
        const draft = await tx.exercise.findUniqueOrThrow({
          where: { id: draftId },
        });
        const target = await tx.exercise.findFirst({
          where: { id: targetId, status: 'CATALOG' },
        });
        if (!target)
          throw new BadRequestException('Запись справочника не найдена.');
        const copies = await tx.exercise.findMany({
          where: { originDraftId: draftId },
          select: { id: true },
        });
        // Заявка должна пережить удаление черновика: отвязываем её до удаления
        await tx.moderationRequest.update({
          where: { id: requestId },
          data: { exerciseId: null, duplicateOfExerciseId: target.id },
        });
        await this.mergeExercises(
          tx,
          [draftId, ...copies.map((c) => c.id)],
          target.id,
        );
        return {
          authorId: request.authorId,
          from: draft.name,
          to: target.name,
        };
      }
      const draftId = request.stretchId!;
      const draft = await tx.stretch.findUniqueOrThrow({
        where: { id: draftId },
      });
      const target = await tx.stretch.findFirst({
        where: { id: targetId, status: 'CATALOG' },
      });
      if (!target)
        throw new BadRequestException('Запись справочника не найдена.');
      await tx.moderationRequest.update({
        where: { id: requestId },
        data: { stretchId: null, duplicateOfStretchId: target.id },
      });
      await tx.workoutStretch.updateMany({
        where: { stretchId: draftId },
        data: { stretchId: target.id },
      });
      await tx.stretch.delete({ where: { id: draftId } });
      return { authorId: request.authorId, from: draft.name, to: target.name };
    });
    this.logger.log(
      `Заявка слита как дубль: requestId=${requestId}, targetId=${targetId}`,
    );
    return {
      authorId: decision.authorId,
      text: `«${decision.from}» объединён с «${decision.to}» — в твоих программах он заменён, история весов сохранена.${note ? ` ${note}.` : ''}`,
    };
  }

  /** Отклонить: запись остаётся личным черновиком автора. */
  public async reject(requestId: number, reason: string): Promise<Decision> {
    const note = cleanReason(reason) ?? 'без причины';
    const request = await this.prisma.$transaction(async (tx) => {
      const decided = await this.decide(tx, requestId, 'REJECTED', note);
      return tx.moderationRequest.findUniqueOrThrow({
        where: { id: decided.id },
        include: REQUEST_INCLUDE,
      });
    });
    this.logger.log(`Заявка отклонена: requestId=${requestId}`);
    const name = request.exercise?.name ?? request.stretch?.name ?? 'Запись';
    return {
      authorId: request.authorId,
      text: `«${name}» не попал в общий справочник: ${note}. У тебя он остаётся.`,
    };
  }

  /** Заявки заблокированного пользователя отклоняются. @returns сколько отклонено. */
  public async rejectAllOf(userId: number): Promise<number> {
    const { count } = await this.prisma.moderationRequest.updateMany({
      where: { authorId: userId, outcome: 'PENDING' },
      data: {
        outcome: 'REJECTED',
        reason: 'автор заблокирован',
        decidedAt: new Date(),
      },
    });
    return count;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /** Заявки только на свои личные оригиналы без заявки в ожидании — проверка прямо в where. */
  private async createRequests(
    tx: Tx,
    userId: number,
    kind: CatalogKind,
    ids: number[],
  ): Promise<RequestFull[]> {
    const where = {
      id: { in: ids },
      status: 'DRAFT' as const,
      authorId: userId,
      originDraftId: null,
      moderationRequests: { none: { outcome: 'PENDING' as const } },
    };
    const entries =
      kind === 'exercise'
        ? await tx.exercise.findMany({ where, select: { id: true } })
        : await tx.stretch.findMany({ where, select: { id: true } });
    const requests: RequestFull[] = [];
    for (const entry of entries)
      requests.push(
        await tx.moderationRequest.create({
          data: {
            authorId: userId,
            ...(kind === 'exercise'
              ? { exerciseId: entry.id }
              : { stretchId: entry.id }),
          },
          include: REQUEST_INCLUDE,
        }),
      );
    return requests;
  }

  /** Заявка меняется только из PENDING: повторное нажатие получает «уже обработано». */
  private async decide(
    tx: Tx,
    requestId: number,
    outcome: ModerationOutcome,
    reason?: string,
  ) {
    const { count } = await tx.moderationRequest.updateMany({
      where: { id: requestId, outcome: 'PENDING' },
      data: { outcome, reason, decidedAt: new Date() },
    });
    if (!count) throw new BadRequestException('Заявка уже обработана.');
    return tx.moderationRequest.findUniqueOrThrow({ where: { id: requestId } });
  }

  /** Заменить упражнения fromIds на toId везде, где на них ссылаются, и удалить их. */
  private async mergeExercises(
    tx: Tx,
    fromIds: number[],
    toId: number,
  ): Promise<void> {
    if (!fromIds.length) return;
    const where = { in: fromIds };
    // История подходов хранит повторы или секунды по мере: смешивать их нельзя
    const measures = await tx.exercise.findMany({
      where: { id: { in: [...fromIds, toId] } },
      select: { measure: true },
      distinct: ['measure'],
    });
    if (measures.length > 1)
      throw new BadRequestException(
        'Упражнения меряются по-разному (повторы и время) — объединить нельзя.',
      );
    await tx.complexExercise.updateMany({
      where: { exerciseId: where },
      data: { exerciseId: toId },
    });
    await tx.workoutExercise.updateMany({
      where: { exerciseId: where },
      data: { exerciseId: toId },
    });
    await tx.workoutExercise.updateMany({
      where: { replacedExerciseId: where },
      data: { replacedExerciseId: toId },
    });
    await tx.exercise.deleteMany({ where: { id: where } });
  }
}
