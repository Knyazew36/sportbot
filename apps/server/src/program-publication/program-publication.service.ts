import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { APP_SCREEN, appBtn, BotSender, msg } from '@/bot';
import { normalizeName } from '@/catalog/catalog.service';
import { paginatePrisma } from '@/common/prisma';
import { Prisma } from '@/generated/prisma/client';
import { COMPLEXES_INCLUDE, toComplexesDto } from '@/program/program-complexes';
import {
  APPROVED_TAG,
  PROGRAM_TAG_ORDER,
  PROGRAM_TAG_SELECT,
} from '@/program-tag/program-tag.service';

import { ProgramReviewListItemResponseDto } from './dto/program-review-list-item.response.dto';
import { ProgramReviewResponseDto } from './dto/program-review.response.dto';
import { ProgramReviewsQueryDto } from './dto/program-reviews-query.dto';
import { PublishProgramDto } from './dto/publish-program.dto';

type Tx = Prisma.TransactionClient;

/** Своих тегов на программе, ждущих проверки, — не больше. */
const OWN_TAGS_MAX = 3;

const PENDING_TAG = {
  isApproved: false,
} satisfies Prisma.ProgramTagWhereInput;

/**
 * Очередь администратора: первая публикация или правка текста ждёт решения, либо автор предложил
 * свой тег к программе, которая уже на проверке или в каталоге.
 */
export const PROGRAM_REVIEW_QUEUE = {
  isTemplate: false,
  OR: [
    { reviewRequestedAt: { not: null } },
    {
      publication: { in: ['PENDING', 'PUBLISHED'] },
      tags: { some: PENDING_TAG },
    },
  ],
} satisfies Prisma.ProgramWhereInput;

/** Уже в каталоге «Программы пользователей» — отсюда админ снимает или удаляет. */
const PUBLISHED_PROGRAMS = {
  isTemplate: false,
  publication: 'PUBLISHED',
} satisfies Prisma.ProgramWhereInput;

const AUTHOR_SELECT = {
  select: { id: true, sportProfile: { select: { displayName: true } } },
} satisfies Prisma.UserDefaultArgs;

const REVIEW_INCLUDE = {
  owner: AUTHOR_SELECT,
  tags: { orderBy: PROGRAM_TAG_ORDER, select: PROGRAM_TAG_SELECT },
  complexes: COMPLEXES_INCLUDE,
} satisfies Prisma.ProgramInclude;

type ReviewRow = Prisma.ProgramGetPayload<{ include: typeof REVIEW_INCLUDE }>;

const LIST_INCLUDE = {
  owner: AUTHOR_SELECT,
  _count: { select: { tags: { where: PENDING_TAG } } },
} satisfies Prisma.ProgramInclude;

type ListRow = Prisma.ProgramGetPayload<{ include: typeof LIST_INCLUDE }>;

/** Текст в каталоге отличается от текущего у автора — значит, правка ждёт проверки. */
const textDiffers = (p: {
  name: string;
  description: string | null;
  publishedName: string | null;
  publishedDescription: string | null;
}): boolean =>
  p.name !== p.publishedName || p.description !== p.publishedDescription;

const RU_TO_LAT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Латинский ключ тега из названия: «Турник дома» → turnik-doma. */
const slugify = (name: string): string =>
  normalizeName(name)
    .split('')
    .map((ch) => RU_TO_LAT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tag';

/**
 * Публикация программ пользователей в каталог «Программы пользователей» и их проверка
 * администратором. Публикуется сама программа: правки состава сразу видны в каталоге,
 * а новое название или описание — только после одобрения.
 */
@Injectable()
export class ProgramPublicationService {
  private readonly logger = new Logger(`📣 ${ProgramPublicationService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: BotSender,
  ) {}

  // ── Автор ───────────────────────────────────────────────────────────────

  /**
   * «Опубликовать» и «Изменить публикацию»: описание, теги, свои теги. Черновик и отклонённая
   * уходят на проверку; у опубликованной теги меняются сразу, а правка текста ждёт решения.
   */
  public async publish(
    userId: number,
    programId: number,
    dto: PublishProgramDto,
  ): Promise<void> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, ownerId: userId, isTemplate: false },
      include: {
        complexes: { select: { _count: { select: { exercises: true } } } },
      },
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    // Копия шаблона или чужой программы в каталоге плодила бы клоны оригинала
    if (program.sourceProgramId) {
      this.logger.warn(
        `Публикация копии: programId=${programId}, sourceProgramId=${program.sourceProgramId}, userId=${userId}`,
      );
      throw new BadRequestException(
        'Это копия чужой программы — опубликовать можно только свою.',
      );
    }
    if (!program.complexes.some((c) => c._count.exercises > 0))
      throw new BadRequestException(
        'Добавь хотя бы один комплекс с упражнениями.',
      );

    const { tagIds, created } = await this.prisma.$transaction(async (tx) => {
      const ids = await this.resolveTags(tx, userId, dto);
      await this.checkGroups(tx, ids, 'author');
      const before = await tx.programTag.findMany({
        where: { programs: { some: { id: programId } }, ...PENDING_TAG },
        select: { id: true },
      });
      await tx.program.update({
        where: { id: programId },
        data: {
          description: dto.description,
          tags: { set: ids.map((id) => ({ id })) },
        },
      });
      await this.dropOrphanTags(tx, userId);
      const known = new Set(before.map((t) => t.id));
      const pending = await tx.programTag.findMany({
        where: { id: { in: ids }, ...PENDING_TAG },
        select: { id: true },
      });
      return {
        tagIds: ids,
        created: pending.filter((t) => !known.has(t.id)).length,
      };
    });
    this.logger.log(
      `Публикация сохранена: programId=${programId}, userId=${userId}, теги=[${tagIds.join(',')}], новых своих тегов=${created}`,
    );

    let submitted: boolean;
    if (program.publication === 'DRAFT' || program.publication === 'REJECTED') {
      await this.prisma.program.update({
        where: { id: programId },
        data: {
          publication: 'PENDING',
          reviewRequestedAt: new Date(),
          rejectReason: null,
        },
      });
      this.logger.log(`На проверку: programId=${programId}, новая программа`);
      await this.notifyAdmins(programId, 'новая программа');
      submitted = true;
    } else submitted = await this.requestReview(programId);
    // Новый свой тег у программы, которая уже в очереди или в каталоге, — тоже повод позвать админа
    if (!submitted && created) await this.notifyAdmins(programId, 'новые теги');
  }

  /** Автор снимает программу с публикации: из каталога пропадает, копии у взявших остаются. */
  public async unpublish(userId: number, programId: number): Promise<void> {
    const { count } = await this.prisma.program.updateMany({
      where: {
        id: programId,
        ownerId: userId,
        isTemplate: false,
        publication: { not: 'DRAFT' },
      },
      data: {
        publication: 'DRAFT',
        publishedName: null,
        publishedDescription: null,
        publishedAt: null,
        reviewRequestedAt: null,
        rejectReason: null,
      },
    });
    if (!count) throw new NotFoundException('Программа не опубликована.');
    this.logger.log(
      `Снята автором с публикации: programId=${programId}, userId=${userId}`,
    );
  }

  /**
   * После переименования: у опубликованной новое название уходит на проверку, а вернул старое —
   * проверять больше нечего.
   */
  public async textChanged(programId: number): Promise<void> {
    await this.requestReview(programId);
  }

  // ── Администратор ───────────────────────────────────────────────────────

  public async queue(query: ProgramReviewsQueryDto) {
    const filter = query.filter_status ?? 'queue';
    const page = await paginatePrisma(this.prisma.program, {
      page: query.page,
      limit: query.limit,
      ...(filter === 'published'
        ? {
            where: PUBLISHED_PROGRAMS,
            orderBy: [
              { publishedAt: { sort: 'desc', nulls: 'last' } },
              { id: 'desc' },
            ],
          }
        : {
            where: PROGRAM_REVIEW_QUEUE,
            orderBy: [
              { reviewRequestedAt: { sort: 'asc', nulls: 'last' } },
              { id: 'asc' },
            ],
          }),
      include: LIST_INCLUDE,
    });
    const items = (page.items as unknown as ListRow[]).map(
      (p): ProgramReviewListItemResponseDto => ({
        id: p.id,
        name: p.name,
        author: p.owner?.sportProfile?.displayName ?? null,
        publication: p.publication,
        textPending: !!p.reviewRequestedAt,
        pendingTagCount: p._count.tags,
        reviewRequestedAt: p.reviewRequestedAt,
        publishedAt: p.publishedAt,
      }),
    );
    this.logger.debug(
      `Программы пользователей: фильтр=${filter}, всего=${page.meta.total}`,
    );
    return { items, meta: page.meta };
  }

  public async one(programId: number): Promise<ProgramReviewResponseDto> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, isTemplate: false },
      include: REVIEW_INCLUDE,
    });
    if (!program) throw new NotFoundException('Программа не найдена.');
    return this.toDto(program);
  }

  /**
   * Одобрить: текущие название и описание уходят в каталог. Свои теги автора к этому моменту
   * должны быть решены, и в каждой группе — тег справочника.
   */
  public async approve(programId: number): Promise<ProgramReviewResponseDto> {
    const program = await this.prisma.$transaction(async (tx) => {
      const found = await tx.program.findFirst({
        where: {
          id: programId,
          isTemplate: false,
          reviewRequestedAt: { not: null },
        },
        include: { tags: { select: { id: true, isApproved: true } } },
      });
      if (!found) throw new BadRequestException('Проверять уже нечего.');
      if (found.tags.some((t) => !t.isApproved))
        throw new BadRequestException(
          'Сначала реши по своим тегам автора: одобри, замени или отклони.',
        );
      await this.checkGroups(
        tx,
        found.tags.map((t) => t.id),
        'admin',
      );
      return tx.program.update({
        where: { id: programId },
        data: {
          publication: 'PUBLISHED',
          publishedName: found.name,
          publishedDescription: found.description,
          publishedAt: found.publishedAt ?? new Date(),
          reviewRequestedAt: null,
          rejectReason: null,
        },
      });
    });
    this.logger.log(
      `Программа одобрена: programId=${programId}, ownerId=${program.ownerId}`,
    );
    await this.notifyAuthor(
      program.ownerId,
      `«${program.name}» опубликована в каталоге «Программы пользователей».`,
      programId,
    );
    return this.one(programId);
  }

  /**
   * Отклонить: первая публикация становится отклонённой; у опубликованной отклоняется только
   * правка текста — в каталоге остаётся одобренный.
   */
  public async reject(
    programId: number,
    reason: string,
  ): Promise<ProgramReviewResponseDto> {
    const program = await this.prisma.program.findFirst({
      where: {
        id: programId,
        isTemplate: false,
        reviewRequestedAt: { not: null },
      },
      select: { publication: true, name: true, ownerId: true },
    });
    if (!program) throw new BadRequestException('Проверять уже нечего.');
    const published = program.publication === 'PUBLISHED';
    await this.prisma.program.update({
      where: { id: programId },
      data: {
        publication: published ? 'PUBLISHED' : 'REJECTED',
        reviewRequestedAt: null,
        rejectReason: reason,
      },
    });
    this.logger.log(
      `Программа отклонена: programId=${programId}, правка текста=${published}`,
    );
    await this.notifyAuthor(
      program.ownerId,
      published
        ? `Новое название или описание «${program.name}» не прошло проверку: ${reason}. В каталоге остался прежний текст.`
        : `«${program.name}» не попала в каталог: ${reason}. Исправь и отправь снова.`,
      programId,
    );
    return this.one(programId);
  }

  /** Снять опубликованную программу из каталога с причиной для автора. */
  public async takeDown(
    programId: number,
    reason: string,
  ): Promise<ProgramReviewResponseDto> {
    const program = await this.prisma.program.findFirst({
      where: { id: programId, isTemplate: false, publication: 'PUBLISHED' },
      select: { name: true, ownerId: true },
    });
    if (!program) throw new BadRequestException('Программа не опубликована.');
    await this.prisma.program.update({
      where: { id: programId },
      data: {
        publication: 'REJECTED',
        publishedName: null,
        publishedDescription: null,
        publishedAt: null,
        reviewRequestedAt: null,
        rejectReason: reason,
      },
    });
    this.logger.log(`Программа снята администратором: programId=${programId}`);
    await this.notifyAuthor(
      program.ownerId,
      `«${program.name}» снята с каталога: ${reason}. Исправь и отправь снова.`,
      programId,
    );
    return this.one(programId);
  }

  /**
   * Удалить программу пользователя совсем: пропадает и у автора. Копии у взявших остаются
   * без связи с источником, история тренировок автора — без ссылки на комплекс.
   */
  public async remove(programId: number, reason: string): Promise<void> {
    let program: { name: string; ownerId: number | null };
    try {
      program = await this.prisma.$transaction(async (tx) => {
        const deleted = await tx.program.delete({
          where: { id: programId, isTemplate: false },
          select: { name: true, ownerId: true },
        });
        if (deleted.ownerId) await this.dropOrphanTags(tx, deleted.ownerId);
        return deleted;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Удаление: программы нет, programId=${programId}`);
        throw new NotFoundException('Программа не найдена.');
      }
      this.logger.error(
        `Сбой удаления программы: programId=${programId}`,
        (error as Error).stack,
      );
      throw error;
    }
    this.logger.log(
      `Программа удалена администратором: programId=${programId}, ownerId=${program.ownerId}`,
    );
    await this.notifyAuthor(
      program.ownerId,
      `«${program.name}» удалена администратором: ${reason}.`,
      null,
    );
  }

  /** Свой тег автора — в справочник, последним чипом группы. */
  public async approveTag(tagId: number): Promise<void> {
    const tag = await this.findPendingTag(tagId);
    const last = await this.prisma.programTag.aggregate({
      where: { groupId: tag.groupId, ...APPROVED_TAG },
      _max: { position: true },
    });
    await this.prisma.programTag.update({
      where: { id: tagId },
      data: { isApproved: true, position: (last._max.position ?? 0) + 1 },
    });
    this.logger.log(`Свой тег одобрен: tagId=${tagId}, «${tag.name}»`);
  }

  /** Дубль: программы с тегом автора переезжают на тег справочника, свой тег удаляется. */
  public async replaceTag(tagId: number, targetId: number): Promise<void> {
    const tag = await this.findPendingTag(tagId);
    const target = await this.prisma.programTag.findFirst({
      where: { id: targetId, groupId: tag.groupId, ...APPROVED_TAG },
      select: { id: true, name: true },
    });
    if (!target)
      throw new BadRequestException(
        'Замена — только на тег справочника той же группы.',
      );
    await this.prisma.$transaction([
      ...tag.programs.map((p) =>
        this.prisma.program.update({
          where: { id: p.id },
          data: { tags: { connect: { id: target.id } } },
        }),
      ),
      this.prisma.programTag.delete({ where: { id: tagId } }),
    ]);
    this.logger.log(
      `Свой тег заменён: tagId=${tagId} → tagId=${target.id}, программ=${tag.programs.length}`,
    );
    await this.notifyAuthor(
      tag.authorId,
      `Тег «${tag.name}» заменён на «${target.name}» — такой уже есть в справочнике.`,
      tag.programs[0]?.id ?? null,
    );
  }

  /** Отклонить свой тег: он снимается с программы и удаляется. */
  public async rejectTag(tagId: number): Promise<void> {
    const tag = await this.findPendingTag(tagId);
    await this.prisma.programTag.delete({ where: { id: tagId } });
    this.logger.log(`Свой тег отклонён: tagId=${tagId}, «${tag.name}»`);
    await this.notifyAuthor(
      tag.authorId,
      `Тег «${tag.name}» не принят — выбери подходящий из списка.`,
      tag.programs[0]?.id ?? null,
    );
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  /**
   * Итоговые теги программы: теги справочника, свои теги автора и новые свои. Новый тег, совпавший
   * с существующим в группе без учёта регистра, не создаётся — берётся существующий.
   */
  private async resolveTags(
    tx: Tx,
    userId: number,
    dto: PublishProgramDto,
  ): Promise<number[]> {
    const existing = await tx.programTag.findMany({
      where: {
        id: { in: dto.tagIds },
        OR: [APPROVED_TAG, { authorId: userId }],
      },
      select: { id: true },
    });
    const ids = new Set(existing.map((t) => t.id));
    for (const draft of dto.newTags) {
      const normalized = normalizeName(draft.name);
      const siblings = await tx.programTag.findMany({
        where: {
          groupId: draft.groupId,
          OR: [APPROVED_TAG, { authorId: userId }],
        },
        select: { id: true, name: true },
      });
      const same = siblings.find((t) => normalizeName(t.name) === normalized);
      if (same) {
        ids.add(same.id);
        continue;
      }
      const tag = await this.createOwnTag(
        tx,
        userId,
        draft.groupId,
        draft.name,
      );
      ids.add(tag.id);
    }
    const own = await tx.programTag.count({
      where: { id: { in: [...ids] }, ...PENDING_TAG },
    });
    if (own > OWN_TAGS_MAX)
      throw new BadRequestException(
        `Своих тегов на проверке — не больше ${OWN_TAGS_MAX}.`,
      );
    return [...ids];
  }

  /** У каждой группы справочника на программе должен быть хотя бы один тег. */
  private async checkGroups(
    tx: Tx,
    tagIds: number[],
    who: 'author' | 'admin',
  ): Promise<void> {
    const groups = await tx.programTagGroup.findMany({
      where: { tags: { some: APPROVED_TAG } },
      select: {
        name: true,
        tags: { where: { id: { in: tagIds } }, select: { id: true } },
      },
    });
    const empty = groups.filter((g) => !g.tags.length).map((g) => g.name);
    if (!empty.length) return;
    throw new BadRequestException(
      who === 'author'
        ? `Выбери тег в группах: ${empty.join(', ')}.`
        : `В группах без тега: ${empty.join(', ')} — отклони программу с причиной.`,
    );
  }

  /** Код тега уникален: при совпадении добавляем номер. */
  private async createOwnTag(
    tx: Tx,
    userId: number,
    groupId: number,
    name: string,
  ) {
    const base = slugify(name);
    const taken = await tx.programTag.findMany({
      where: { code: { startsWith: base } },
      select: { code: true },
    });
    const codes = new Set(taken.map((t) => t.code));
    let code = base;
    for (let n = 2; codes.has(code); n++) code = `${base}-${n}`;
    try {
      const tag = await tx.programTag.create({
        data: {
          code,
          name: name.replace(/\s+/g, ' '),
          groupId,
          position: 0,
          isApproved: false,
          authorId: userId,
        },
        select: { id: true },
      });
      this.logger.log(
        `Свой тег предложен: tagId=${tag.id}, groupId=${groupId}, userId=${userId}, code=${code}`,
      );
      return tag;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      )
        throw new BadRequestException(
          'Группа тегов не найдена — обнови экран.',
        );
      throw error;
    }
  }

  /** Свои теги автора, которые он снял со всех программ, больше никому не нужны. */
  private async dropOrphanTags(tx: Tx, userId: number): Promise<void> {
    const { count } = await tx.programTag.deleteMany({
      where: { authorId: userId, ...PENDING_TAG, programs: { none: {} } },
    });
    if (count)
      this.logger.debug(
        `Брошенные свои теги удалены: userId=${userId}, ${count}`,
      );
  }

  /**
   * У опубликованной программы сверить текст с одобренным и поставить или снять отметку
   * «ждёт проверки». @returns true, если правка только что ушла на проверку
   */
  private async requestReview(programId: number): Promise<boolean> {
    const p = await this.prisma.program.findUnique({
      where: { id: programId },
      select: {
        publication: true,
        name: true,
        description: true,
        publishedName: true,
        publishedDescription: true,
        reviewRequestedAt: true,
      },
    });
    if (p?.publication !== 'PUBLISHED') return false;
    if (!textDiffers(p)) {
      if (p.reviewRequestedAt) {
        await this.prisma.program.update({
          where: { id: programId },
          data: { reviewRequestedAt: null },
        });
        this.logger.log(
          `Текст вернули к одобренному — проверка не нужна: programId=${programId}`,
        );
      }
      return false;
    }
    if (p.reviewRequestedAt) return false;
    await this.prisma.program.update({
      where: { id: programId },
      data: { reviewRequestedAt: new Date(), rejectReason: null },
    });
    this.logger.log(`На проверку: programId=${programId}, правка текста`);
    await this.notifyAdmins(programId, 'правка названия или описания');
    return true;
  }

  private async findPendingTag(tagId: number) {
    const tag = await this.prisma.programTag.findFirst({
      where: { id: tagId, ...PENDING_TAG },
      select: {
        id: true,
        name: true,
        groupId: true,
        authorId: true,
        programs: { select: { id: true } },
      },
    });
    if (!tag) throw new BadRequestException('Тег уже обработан.');
    return tag;
  }

  private async notifyAdmins(programId: number, kind: string): Promise<void> {
    const program = await this.prisma.program.findUnique({
      where: { id: programId },
      select: {
        name: true,
        owner: { select: { sportProfile: { select: { displayName: true } } } },
      },
    });
    if (!program) return;
    const author = program.owner?.sportProfile?.displayName ?? 'пользователя';
    await this.sender.sendToAdmins(
      msg(`Программа на проверку (${kind}): «${program.name}» от ${author}`, [
        [appBtn(APP_SCREEN.programReview(programId))],
      ]),
    );
  }

  private async notifyAuthor(
    authorId: number | null,
    text: string,
    programId: number | null,
  ): Promise<void> {
    if (!authorId) return;
    const sent = await this.sender.sendToUserId(
      authorId,
      msg(
        text,
        programId ? [[appBtn(APP_SCREEN.program(programId))]] : undefined,
      ),
    );
    this.logger.debug(
      `Автору о решении: userId=${authorId}, доставлено=${sent}`,
    );
  }

  private toDto(program: ReviewRow): ProgramReviewResponseDto {
    return {
      id: program.id,
      name: program.name,
      description: program.description,
      publishedName: program.publishedName,
      publishedDescription: program.publishedDescription,
      publication: program.publication,
      textPending: !!program.reviewRequestedAt,
      authorId: program.owner?.id ?? null,
      author: program.owner?.sportProfile?.displayName ?? null,
      tags: program.tags,
      complexes: toComplexesDto(program.complexes, null),
    };
  }
}
