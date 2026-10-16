import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { BotSender } from '@/bot';
import { CatalogService } from '@/catalog/catalog.service';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';

import { CreateDraftDto } from './dto/create-draft.dto';
import { DraftLimitResponseDto } from './dto/draft-limit.response.dto';
import { MyEntryResponseDto } from './dto/my-entry.response.dto';
import { MineEntry, ModerationService } from './moderation.service';

/** Свои упражнения и растяжки в Mini App (frontend-tz, 11.4–11.5): мастер, лимит, вкладка «Мои». */
@Injectable()
export class DraftAppService {
  private readonly logger = new Logger(`🛡 ${DraftAppService.name}`);

  constructor(
    private readonly moderation: ModerationService,
    private readonly catalog: CatalogService,
    private readonly sender: BotSender,
  ) {}

  public limit(userId: number): Promise<DraftLimitResponseDto> {
    return this.moderation.remaining(userId);
  }

  /** Личный черновик и заявка на модерацию; администраторам — сообщение в бот, как из мастера бота. */
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

    const request = await this.moderation.submit(userId, {
      kind: dto.kind,
      name: dto.name,
      primary: dto.primary,
      // У растяжки мышцы одного вида — все в primary
      secondary: isExercise ? (dto.secondary ?? []) : [],
      technique: dto.technique || undefined,
      videoUrl: dto.videoUrl || undefined,
      holdSeconds: dto.holdSeconds,
      perSide: dto.perSide,
      imagePath: dto.imagePath,
      // У растяжки инвентаря и суставов нет
      ...(isExercise && {
        equipment: dto.equipment,
        jointIds: dto.jointIds,
      }),
    });
    await this.sender.sendToAdmins(this.moderation.requestMessage(request));
    this.logger.log(
      `Своя запись из приложения: requestId=${request.id}, userId=${userId}, ${dto.kind}`,
    );
    return {
      id: request.id,
      kind: dto.kind,
      entryId: request.exerciseId ?? request.stretchId,
      name: request.exercise?.name ?? request.stretch?.name ?? dto.name,
      outcome: request.outcome,
      reason: request.reason,
      createdAt: request.createdAt,
    };
  }

  public async mine(userId: number, query: PaginationQueryDto) {
    const page = await this.moderation.mineList(
      userId,
      query.page,
      query.limit,
    );
    return { items: page.items.map((r) => this.entry(r)), meta: page.meta };
  }

  private entry(request: MineEntry): MyEntryResponseDto {
    const kind =
      request.exerciseId || request.duplicateOfExerciseId
        ? 'exercise'
        : 'stretch';
    // Дубль: черновик удалён, ссылка ведёт на запись справочника, которая его заменила
    const target =
      request.exercise ??
      request.stretch ??
      request.duplicateOfExercise ??
      request.duplicateOfStretch;
    return {
      id: request.id,
      kind,
      entryId: target?.id ?? null,
      name: target?.name ?? 'Удалённая запись',
      outcome: request.outcome,
      reason: request.reason,
      createdAt: request.createdAt,
    };
  }
}
