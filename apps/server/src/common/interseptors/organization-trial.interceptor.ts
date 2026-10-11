import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { SKIP_READONLY_CHECK_KEY } from '@/common/decorators/skip-readonly-check.decorator';
import { ENTITY_EMOJI } from '@/common/utils';
import { PrismaService } from 'prisma/prisma.service';

import { RequestWithOrganization } from '../types/request-with-organization';

/**
 * После пробного периода кружок только для чтения: любая мутация с организацией из запроса
 * отвечает 403 TRIAL_EXPIRED. Срабатывает после guard'ов (OrgScopeGuard/ResourceScopeGuard
 * уже выставили request.organizationId). Точечные исключения — @SkipReadonlyCheck().
 */
@Injectable()
export class OrganizationTrialInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OrganizationTrialInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithOrganization>();
    if (request.method === 'GET' || !request.organizationId) {
      return next.handle();
    }
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(
      SKIP_READONLY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return next.handle();
    }

    const organizationId = request.organizationId;
    return from(
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { trialEndsAt: true },
      }),
    ).pipe(
      mergeMap((organization) => {
        const trialEndsAt = organization?.trialEndsAt;
        if (trialEndsAt && trialEndsAt.getTime() <= Date.now()) {
          this.logger.warn(
            `${ENTITY_EMOJI.organization} Мутация ${request.method} ${request.url} заблокирована: пробный период org=${organizationId} истёк ${trialEndsAt.toISOString()}`,
          );
          throw new ForbiddenException({
            code: 'TRIAL_EXPIRED',
            message:
              'Пробный период кружка закончился. Кружок доступен только для чтения — продлите доступ, чтобы вносить изменения.',
            organizationId,
            trialEndsAt,
          });
        }
        return next.handle();
      }),
    );
  }
}
