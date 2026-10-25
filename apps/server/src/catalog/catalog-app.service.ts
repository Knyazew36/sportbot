import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { BotSender, isAdmin } from '@/bot';
import { paginatePrisma } from '@/common/prisma';
import { Prisma, User } from '@/generated/prisma/client';
import { UploadService } from '@/upload/upload.service';

import {
  CatalogKind,
  CatalogService,
  EXERCISE_INCLUDE,
  normalizeName,
  PENDING_REQUEST_INCLUDE,
  publishState,
  STRETCH_INCLUDE,
} from './catalog.service';
import { CatalogExerciseResponseDto } from './dto/catalog-exercise.response.dto';
import { CatalogImageResponseDto } from './dto/catalog-image.response.dto';
import { CatalogListItemResponseDto } from './dto/catalog-list-item.response.dto';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { CatalogRefResponseDto } from './dto/catalog-ref.response.dto';
import { CatalogStretchResponseDto } from './dto/catalog-stretch.response.dto';
import { imageCredit } from './dto/image-credit.response.dto';
import { ComplaintCreatedResponseDto } from './dto/complaint-created.response.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CreateExerciseProposalDto } from './dto/create-exercise-proposal.dto';
import { CreateStretchProposalDto } from './dto/create-stretch-proposal.dto';
import {
  exerciseForm,
  proposalChanges,
  proposalDiff,
  stretchForm,
} from './catalog-proposal';

const LIST_EXERCISE_INCLUDE = {
  muscles: { include: { muscle: true } },
} satisfies Prisma.ExerciseInclude;

type ExerciseRow = Prisma.ExerciseGetPayload<{
  include: typeof LIST_EXERCISE_INCLUDE;
}>;
type StretchRow = Prisma.StretchGetPayload<{ include: typeof STRETCH_INCLUDE }>;

type MuscleLink = { role?: string; muscle: CatalogRefResponseDto };

const ref = (item: { id: number; code: string; name: string }) => ({
  id: item.id,
  code: item.code,
  name: item.name,
});

const names = (muscles: MuscleLink[], onlyPrimary: boolean): string =>
  muscles
    .filter((m) => !onlyPrimary || m.role === 'PRIMARY')
    .map((m) => m.muscle.name)
    .join(' · ');

/** Слова запроса — все должны входить в название (как поиск в боте). */
const nameWords = (search?: string) =>
  normalizeName(search ?? '')
    .split(' ')
    .filter(Boolean)
    .map((word) => ({ nameNormalized: { contains: word } }));

/** Справочник в Mini App (frontend-tz, 11): поиск с фильтрами, карточки, жалобы. */
@Injectable()
export class CatalogAppService {
  private readonly logger = new Logger(`📚 ${CatalogAppService.name}`);

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
    private readonly uploads: UploadService,
    private readonly sender: BotSender,
  ) {}

  // ── Справочники ─────────────────────────────────────────────────────────

  public async muscles(): Promise<CatalogRefResponseDto[]> {
    return (await this.catalog.muscles()).map(ref);
  }

  public async joints(): Promise<CatalogRefResponseDto[]> {
    return (await this.catalog.joints()).map(ref);
  }

  // ── Упражнения ──────────────────────────────────────────────────────────

  /** Выдача: общий справочник и свои черновики; поиск по словам названия, мышца, инвентарь. */
  public async exercises(userId: number, query: CatalogQueryDto) {
    const where: Prisma.ExerciseWhereInput = {
      AND: [
        this.catalog.visibleExercises(userId),
        ...nameWords(query.search),
        ...(query.filter_muscle?.length
          ? [
              {
                muscles: {
                  some: {
                    muscleId: { in: query.filter_muscle },
                    role: 'PRIMARY' as const,
                  },
                },
              },
            ]
          : []),
        ...(query.filter_equipment
          ? [{ equipment: query.filter_equipment }]
          : []),
      ],
    };
    const page = await paginatePrisma(this.prisma.exercise, {
      page: query.page,
      limit: query.limit,
      where,
      include: LIST_EXERCISE_INCLUDE,
      orderBy: { name: 'asc' },
    });
    this.logger.debug(
      `Упражнения: userId=${userId}, найдено=${page.meta.total}, стр.${page.meta.page}`,
    );
    return {
      items: (page.items as unknown as ExerciseRow[]).map(
        (e): CatalogListItemResponseDto => ({
          id: e.id,
          name: e.name,
          muscles: names(e.muscles, true),
          imageUrl: this.uploads.toPublicUrl(e.imagePath),
          equipment: e.equipment,
          holdSeconds: null,
          draft: e.status === 'DRAFT',
        }),
      ),
      meta: page.meta,
    };
  }

  public async exercise(
    user: User,
    id: number,
  ): Promise<CatalogExerciseResponseDto> {
    // Админ на проверке программы открывает и черновики автора
    const admin = isAdmin(user);
    const exercise = await this.prisma.exercise.findFirst({
      where: admin ? { id } : { id, ...this.catalog.visibleExercises(user.id) },
      include: { ...EXERCISE_INCLUDE, ...PENDING_REQUEST_INCLUDE },
    });
    if (!exercise) {
      this.logger.warn(
        `Карточка упражнения не найдена: id=${id}, userId=${user.id}, admin=${admin}`,
      );
      throw new NotFoundException('Упражнение не найдено.');
    }
    return {
      id: exercise.id,
      name: exercise.name,
      imageUrl: this.uploads.toPublicUrl(exercise.imagePath),
      technique: exercise.technique,
      steps: exercise.steps,
      mistakes: exercise.mistakes,
      imageEndUrl: this.uploads.toPublicUrl(exercise.imageEndPath),
      imageCredit: imageCredit(exercise),
      videoUrl: exercise.videoUrl,
      equipment: exercise.equipment,
      measure: exercise.measure,
      primaryMuscles: exercise.muscles
        .filter((m) => m.role === 'PRIMARY')
        .map((m) => ref(m.muscle)),
      secondaryMuscles: exercise.muscles
        .filter((m) => m.role === 'SECONDARY')
        .map((m) => ref(m.muscle)),
      joints: exercise.joints.map((j) => ref(j.joint)),
      draft: exercise.status === 'DRAFT',
      ...publishState(exercise, user.id),
    };
  }

  // ── Растяжки ────────────────────────────────────────────────────────────

  public async stretches(userId: number, query: CatalogQueryDto) {
    const where: Prisma.StretchWhereInput = {
      AND: [
        this.catalog.visibleStretches(userId),
        ...nameWords(query.search),
        ...(query.filter_muscle?.length
          ? [{ muscles: { some: { muscleId: { in: query.filter_muscle } } } }]
          : []),
      ],
    };
    const page = await paginatePrisma(this.prisma.stretch, {
      page: query.page,
      limit: query.limit,
      where,
      include: STRETCH_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return {
      items: (page.items as unknown as StretchRow[]).map(
        (s): CatalogListItemResponseDto => ({
          id: s.id,
          name: s.name,
          muscles: names(s.muscles, false),
          imageUrl: this.uploads.toPublicUrl(s.imagePath),
          equipment: null,
          holdSeconds: s.holdSeconds,
          draft: s.status === 'DRAFT',
        }),
      ),
      meta: page.meta,
    };
  }

  public async stretch(
    userId: number,
    id: number,
  ): Promise<CatalogStretchResponseDto> {
    const stretch = await this.catalog.findStretch(userId, id);
    if (!stretch) throw new NotFoundException('Растяжка не найдена.');
    return {
      id: stretch.id,
      name: stretch.name,
      imageUrl: this.uploads.toPublicUrl(stretch.imagePath),
      howTo: stretch.howTo,
      steps: stretch.steps,
      mistakes: stretch.mistakes,
      imageEndUrl: this.uploads.toPublicUrl(stretch.imageEndPath),
      feel: stretch.feel,
      videoUrl: stretch.videoUrl,
      imageCredit: imageCredit(stretch),
      holdSeconds: stretch.holdSeconds,
      perSide: stretch.perSide,
      muscles: stretch.muscles.map((m) => ref(m.muscle)),
      draft: stretch.status === 'DRAFT',
      ...publishState(stretch, userId),
    };
  }

  // ── Подсказка и жалобы ──────────────────────────────────────────────────

  /** «Возможно, ты искал…» при вводе названия своей записи. */
  public similar(kind: CatalogKind, name: string) {
    return this.catalog.similar(kind, name);
  }

  /** «Ошибка в описании»: жалоба уходит администраторам в бот (business-tz, 5.7). */
  public async complain(
    userId: number,
    dto: CreateComplaintDto,
  ): Promise<ComplaintCreatedResponseDto> {
    const target =
      dto.kind === 'exercise'
        ? await this.catalog.findExercise(userId, dto.id)
        : await this.catalog.findStretch(userId, dto.id);
    if (!target) throw new NotFoundException('Запись не найдена.');
    const complaint = await this.catalog.createComplaint({
      userId,
      kind: dto.kind,
      id: dto.id,
      text: dto.text,
    });
    await this.sender.sendToAdmins(this.catalog.complaintMessage(complaint));
    return { id: complaint.id };
  }

  // ── Правка упражнения ───────────────────────────────────────────────────

  /** Картинка к правке: файл уже проверен и лежит в стейджинге — переносим к картинкам справочника. */
  public image(file: Express.Multer.File): CatalogImageResponseDto {
    this.uploads.verifyImageSignatureOrThrow(file);
    const imagePath = this.uploads.commitToCategory(file.path, 'catalog');
    this.logger.log(`Картинка к правке загружена: ${imagePath}`);
    return { imagePath, imageUrl: this.uploads.toPublicUrl(imagePath)! };
  }

  /** Правка упражнения уходит администраторам: в базе — только реально изменённые поля. */
  public async proposeExercise(
    userId: number,
    dto: CreateExerciseProposalDto,
  ): Promise<ComplaintCreatedResponseDto> {
    const { exerciseId, comment, ...fields } = dto;
    const exercise = await this.catalog.findExercise(userId, exerciseId);
    if (!exercise) throw new NotFoundException('Упражнение не найдено.');
    return this.propose(userId, 'exercise', exerciseId, comment, {
      current: exerciseForm(exercise),
      fields,
    });
  }

  /** Правка растяжки — так же, как упражнения. */
  public async proposeStretch(
    userId: number,
    dto: CreateStretchProposalDto,
  ): Promise<ComplaintCreatedResponseDto> {
    const { stretchId, comment, ...fields } = dto;
    const stretch = await this.catalog.findStretch(userId, stretchId);
    if (!stretch) throw new NotFoundException('Растяжка не найдена.');
    return this.propose(userId, 'stretch', stretchId, comment, {
      current: stretchForm(stretch),
      fields,
    });
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private async propose<T extends object>(
    userId: number,
    kind: CatalogKind,
    id: number,
    comment: string | undefined,
    form: { current: T; fields: Partial<T> },
  ): Promise<ComplaintCreatedResponseDto> {
    const proposal = proposalDiff(kind, form.current, form.fields);
    if (!Object.keys(proposal).length)
      throw new BadRequestException(
        'Ничего не изменено — поправь хотя бы одно поле.',
      );
    const complaint = await this.catalog.createComplaint({
      userId,
      kind,
      id,
      text: comment ?? '',
      proposal,
    });
    const changes = proposalChanges(
      kind,
      form.current,
      proposal,
      await this.catalog.refNames(),
    );
    await this.sender.sendToAdmins(
      this.catalog.complaintMessage(complaint, changes),
    );
    return { id: complaint.id };
  }
}
