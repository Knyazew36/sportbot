import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

import { localToday } from '@/bot';
import { paginatePrisma } from '@/common/prisma';
import { PaginationQueryDto } from '@/common/type/pagination-query.dto';
import { Prisma, StretchSession } from '@/generated/prisma/client';
import { dayOf, timeOf, timeOrNull } from '@/sync/sync-format';

import { CreateStretchSessionDto } from './dto/create-stretch-session.dto';
import { StretchSessionResponseDto } from './dto/stretch-session.response.dto';
import { UpdateStretchSessionDto } from './dto/update-stretch-session.dto';

/** Отдельные занятия растяжкой: в статистику тренировок и календарь не идут. */
@Injectable()
export class StretchSessionService {
  private readonly logger = new Logger(`🧘 ${StretchSessionService.name}`);

  constructor(private readonly prisma: PrismaService) {}

  // ── Чтение ──────────────────────────────────────────────────────────────

  public async list(userId: number, query: PaginationQueryDto) {
    const page = await paginatePrisma(this.prisma.stretchSession, {
      page: query.page,
      limit: query.limit,
      where: { userId },
      orderBy: { startedAt: 'desc' },
    });
    return {
      items: (page.items as unknown as StretchSession[]).map((s) =>
        this.view(s),
      ),
      meta: page.meta,
    };
  }

  public async find(
    userId: number,
    id: number,
  ): Promise<StretchSessionResponseDto> {
    const item = await this.prisma.stretchSession.findFirst({
      where: { id, userId },
    });
    if (!item) throw new NotFoundException('Занятие не найдено.');
    return this.view(item);
  }

  // ── Запись ──────────────────────────────────────────────────────────────

  public async create(
    userId: number,
    dto: CreateStretchSessionDto,
  ): Promise<StretchSessionResponseDto> {
    const [routine, profile] = await Promise.all([
      this.prisma.stretchRoutine.findFirst({
        where: { id: dto.routineId, published: true },
        select: { id: true, name: true },
      }),
      this.prisma.sportProfile.findUniqueOrThrow({
        where: { userId },
        select: { timeZone: true },
      }),
    ]);
    if (!routine) throw new NotFoundException('Комплекс не найден.');
    const item = await this.prisma.stretchSession.create({
      data: {
        userId,
        routineId: routine.id,
        routineName: routine.name,
        date: localToday(profile.timeZone),
        ...(dto.at ? { startedAt: new Date(dto.at) } : {}),
      },
    });
    this.logger.log(
      `Занятие начато: id=${item.id}, userId=${userId}, routineId=${routine.id}`,
    );
    return this.view(item);
  }

  public async update(
    userId: number,
    id: number,
    dto: UpdateStretchSessionDto,
  ): Promise<StretchSessionResponseDto> {
    const finishedAt = new Date(dto.finishedAt);
    try {
      const item = await this.prisma.stretchSession.update({
        where: { id, userId },
        data: { finishedAt },
      });
      this.logger.log(`Занятие пройдено: id=${id}, userId=${userId}`);
      return this.view(item);
    } catch (error) {
      throw this.known(error);
    }
  }

  public async remove(userId: number, id: number): Promise<void> {
    try {
      await this.prisma.stretchSession.delete({ where: { id, userId } });
    } catch (error) {
      throw this.known(error);
    }
    this.logger.log(`Занятие удалено: id=${id}, userId=${userId}`);
  }

  // ── С телефона ──────────────────────────────────────────────────────────

  /** Начало с телефона: повтор операции не создаёт вторую строку. */
  public async startFromClient(
    userId: number,
    clientId: string,
    row: {
      routineId: number;
      routineName: string;
      date: string;
      startedAt: string;
    },
  ): Promise<number> {
    // Комплекс могли удалить, пока телефон был без сети: занятие остаётся со снимком названия
    const routine = await this.prisma.stretchRoutine.findUnique({
      where: { id: row.routineId },
      select: { id: true },
    });
    const item = await this.prisma.stretchSession.upsert({
      where: { clientId },
      update: {},
      create: {
        clientId,
        userId,
        routineId: routine?.id ?? null,
        routineName: row.routineName,
        date: new Date(`${row.date}T00:00:00.000Z`),
        startedAt: new Date(row.startedAt),
      },
      select: { id: true },
    });
    this.logger.log(
      `Занятие с телефона: id=${item.id}, userId=${userId}, routineId=${row.routineId}`,
    );
    return item.id;
  }

  /** Конец с телефона. Строки нет — false: занятие уже удалено. */
  public async finishFromClient(
    userId: number,
    clientId: string,
    finishedAt: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.stretchSession.updateMany({
      where: { clientId, userId },
      data: { finishedAt: new Date(finishedAt) },
    });
    return count > 0;
  }

  /** Удаление с телефона. Строки нет — false: уже удалено. */
  public async removeFromClient(
    userId: number,
    clientId: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.stretchSession.deleteMany({
      where: { clientId, userId },
    });
    return count > 0;
  }

  // ── Внутреннее ──────────────────────────────────────────────────────────

  private view(item: StretchSession): StretchSessionResponseDto {
    return {
      id: item.id,
      routineId: item.routineId,
      routineName: item.routineName,
      date: dayOf(item.date),
      startedAt: timeOf(item.startedAt),
      finishedAt: timeOrNull(item.finishedAt),
    };
  }

  private known(error: unknown): unknown {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
    if (error.code === 'P2025')
      return new NotFoundException('Занятие не найдено.');
    this.logger.error(`Сбой записи занятия: ${error.code}`, error.stack);
    return error;
  }
}
