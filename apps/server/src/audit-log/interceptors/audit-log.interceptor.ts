import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';

import { RequestWithOrganization } from '@/common/types/request-with-organization';
import { ENTITY_EMOJI } from '@/common/utils';

import { AuditLogService } from '../audit-log.service';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const SECRET_KEY_PATTERN = /password|token|secret/i;

/** Рекурсивно вырезает ключи password/token/secret из тела запроса перед записью в аудит-лог. */
function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SECRET_KEY_PATTERN.test(key))
        .map(([key, val]) => [key, sanitizePayload(val)]),
    );
  }
  return value;
}

/**
 * Глобальный interceptor: автоматически пишет строку AuditLog на каждую успешную мутацию
 * (POST/PATCH/PUT/DELETE) в организационном контексте. entity/action выводятся из маршрута,
 * а не размечаются вручную на контроллерах: первый статический сегмент пути — entity,
 * остальные статические сегменты — действие; если их нет, действие берётся из HTTP-метода.
 * Примеры: POST /invite/create → "invite.create", POST /join-request/:id/approve →
 * "join-request.approve", POST /organization/:id/member/delete/:userId → "organization.member.delete".
 *
 * Логирует только запросы, где OrgScopeGuard/ResourceScopeGuard уже проставил
 * request.organizationId — это естественно исключает /auth, /user и прочие эндпоинты
 * без орг-контекста. Точечное исключение — @SkipAudit().
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auditLog} ${AuditLogInterceptor.name}`,
  );

  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly reflector: Reflector,
  ) {}

  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    if ((context.getType() as string) !== 'http') {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();

    if (!MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return next.handle();
    }

    const organizationId = request.organizationId
      ? Number(request.organizationId)
      : undefined;
    if (!organizationId) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((result) => {
        this.record(request, organizationId, result).catch((err) =>
          this.logger.error(
            `Не удалось записать аудит-лог: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      }),
    );
  }

  private async record(
    request: RequestWithOrganization,
    organizationId: number,
    result: unknown,
  ) {
    const rawPath = (request.originalUrl || request.url || '').split('?')[0];
    const segments = rawPath
      .replace(/^\/api\/?/, '')
      .split('/')
      .filter(Boolean);
    const paramValues = new Set(
      Object.values(request.params ?? {}).map(String),
    );
    const staticSegments = segments.filter(
      (segment) => !paramValues.has(segment),
    );

    if (staticSegments.length === 0) {
      return;
    }

    const entity = staticSegments[0];
    const verb =
      staticSegments.length > 1
        ? staticSegments.slice(1).join('.')
        : request.method === 'DELETE'
          ? 'delete'
          : request.method === 'POST'
            ? 'create'
            : 'update';

    const paramId = Number(request.params?.id);
    // result.id — если этот interceptor видит сырой ответ хендлера; result.data.id — если ResponseInterceptor
    // уже успел обернуть ответ в {status, data, timestamp} (порядок APP_INTERCEPTOR не гарантирован строго).
    const resultId =
      (result as { id?: unknown; data?: { id?: unknown } })?.id ??
      (result as any)?.data?.id;
    const entityId = Number.isInteger(paramId)
      ? paramId
      : typeof resultId === 'number'
        ? resultId
        : null;

    const user = request.user;
    const userName = user
      ? [user.name, user.lastName].filter(Boolean).join(' ') ||
        user.email ||
        user.phone ||
        null
      : null;

    await this.auditLogService.create({
      organizationId,
      userId: user?.id ?? null,
      userName,
      action: `${entity}.${verb}`,
      entity,
      entityId,
      payload: sanitizePayload(request.body),
    });
  }
}
