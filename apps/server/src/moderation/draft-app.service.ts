import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { BotSender } from '@/bot';
import { CatalogKind, CatalogService } from '@/catalog/catalog.service';

import { CreateDraftDto } from './dto/create-draft.dto';
import { MyEntriesQueryDto } from './dto/my-entries-query.dto';
import { MyEntryResponseDto } from './dto/my-entry.response.dto';
import { MineEntry, ModerationService } from './moderation.service';

/** Свои упражнения и растяжки в Mini App (frontend-tz, 11.4–11.5): мастер, публикация, вкладка «Мои». */
@Injectable()
export class DraftAppService {
  private readonly logger = new Logger(`🛡 ${DraftAppService.name}`);

  constructor(
    private readonly moderation: ModerationService,
    private readonly catalog: CatalogService,
    private readonly sender: BotSender,
  ) {}

  /** Личная запись: сразу доступна автору, администраторам ничего не уходит. */
  public async create(
    userId: number,
    dto: CreateDraftDto,
  ): Promise<MyEntryResponseDto> {
    const known = new Set((await this.catalog.muscles()).map((m) => m.id));
    const muscles = [...dto.primary, ...(dto.secondary ?? [])];
    if (muscles.some((id) => !known.has(id)))
      throw new BadRequestException('Неизвестная мышца — обнови экран.');
    const joints = new Set((await this.catalog.joints()).map((j) => j.id));
    if (dto.jointIds?.some((id) => !joints.has(id)))
      throw new BadRequestException('Неизвестный сустав — обнови экран.');
    const isExercise = dto.kind === 'exercise';

    const entry = await this.moderation.createDraft(userId, {
      kind: dto.kind,
      name: dto.name,
      primary: dto.primary,
      // У растяжки мышцы одного вида — все в primary
      secondary: isExercise ? (dto.secondary ?? []) : [],
      technique: dto.technique || undefined,
      steps: dto.steps,
      mistakes: dto.mistakes,
      videoUrl: dto.videoUrl || undefined,
      holdSeconds: dto.holdSeconds,
      perSide: dto.perSide,
      imagePath: dto.imagePath,
      // У растяжки инвентаря и суставов нет
      ...(isExercise && {
        equipment: dto.equipment,
        measure: dto.measure,
        jointIds: dto.jointIds,
      }),
    });
    return {
      id: entry.id,
      kind: dto.kind,
      name: entry.name,
      status: 'DRAFT',
      outcome: null,
      reason: null,
      createdAt: entry.createdAt,
    };
  }

  /** «Опубликовать»: заявка на модерацию и сообщение администраторам в бот. */
  public async publish(
    userId: number,
    kind: CatalogKind,
    entryId: number,
  ): Promise<void> {
    const request = await this.moderation.requestPublish(userId, kind, entryId);
    await this.sender.sendToAdmins(this.moderation.requestMessage(request));
    this.logger.log(
      `Публикация из приложения: requestId=${request.id}, userId=${userId}, ${kind}Id=${entryId}`,
    );
  }

  public async mine(userId: number, query: MyEntriesQueryDto) {
    const page = await this.moderation.mineList(
      userId,
      query.filter_kind,
      query.page,
      query.limit,
    );
    return {
      items: page.items.map((e) => this.entry(query.filter_kind, e)),
      meta: page.meta,
    };
  }

  private entry(kind: CatalogKind, entry: MineEntry): MyEntryResponseDto {
    const last = entry.moderationRequests[0];
    return {
      id: entry.id,
      kind,
      name: entry.name,
      status: entry.status,
      outcome: last?.outcome ?? null,
      reason: last?.reason ?? null,
      createdAt: entry.createdAt,
    };
  }
}
