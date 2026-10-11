import { Injectable, Logger } from '@nestjs/common';

import { paginatePrisma } from '@/common/prisma/prisma-paginate';
import { ENTITY_EMOJI } from '@/common/utils';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from 'prisma/prisma.service';

import { AuditLogItemDto } from './dto/audit-log-item.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

/** Начало дня для date-only строки; полная ISO-строка берётся как есть. */
function startOfDay(iso: string): Date {
  return iso.includes('T') ? new Date(iso) : new Date(`${iso}T00:00:00`);
}

/** Конец дня (включительно) для date-only строки. */
function endOfDay(iso: string): Date {
  return iso.includes('T') ? new Date(iso) : new Date(`${iso}T23:59:59.999`);
}

export interface CreateAuditLogInput {
  organizationId: number;
  userId?: number | null;
  userName?: string | null;
  action: string;
  entity: string;
  entityId?: number | null;
  payload?: unknown;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auditLog} ${AuditLogService.name}`,
  );

  constructor(private readonly prisma: PrismaService) {}

  public create(input: CreateAuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        userName: input.userName ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        payload: input.payload ?? Prisma.JsonNull,
      },
    });
  }

  public async list(organizationId: number, query: QueryAuditLogDto) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: startOfDay(query.from) } : {}),
              ...(query.to ? { lte: endOfDay(query.to) } : {}),
            },
          }
        : {}),
    };

    const { items, meta } = await paginatePrisma(this.prisma.auditLog, {
      page: query.page,
      limit: query.limit,
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, lastName: true } } },
    } as any);

    const mapped: AuditLogItemDto[] = (items as any[]).map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      payload: log.payload,
      userId: log.userId,
      userDisplayName: log.user
        ? [log.user.name, log.user.lastName].filter(Boolean).join(' ') ||
          log.userName ||
          null
        : (log.userName ?? null),
      createdAt: log.createdAt,
    }));

    this.logger.debug(`list org=${organizationId}: ${meta.total}`);
    return { items: mapped, meta };
  }
}
