import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';

import { RequestWithOrganization } from '../types/request-with-organization';
import { resolveEntityEmoji } from '../utils';

// Поля, которые нельзя писать в логи открытым текстом
const SENSITIVE_FIELDS = [];

function redactBody(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return String(body ?? '');
  }
  const copy: Record<string, unknown> = {
    ...(body as Record<string, unknown>),
  };
  for (const field of SENSITIVE_FIELDS) {
    if (field in copy) {
      copy[field] = '***';
    }
  }
  return JSON.stringify(copy);
}

export class LoggerMiddleware implements NestMiddleware {
  use(req: RequestWithOrganization, res: Response, next: NextFunction) {
    const emoji = resolveEntityEmoji(req.originalUrl);
    const startedAt = Date.now();

    Logger.log(
      `${emoji} Request ${req.method} originalUrl: ${req.originalUrl}  body: ${redactBody(req.body)} `,
    );

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      // На момент finish guard'ы (MultiAuthGuard/OrganizationAccessGuard) уже отработали
      // и проставили req.user/req.organizationId, хотя сам middleware выполняется до них.
      // const who = req.user ? ` user=${req?.user?.id}${req?.organizationId ? ` org=${req?.organizationId}` : ''}` : ''
      const message = `${emoji} ${req.method} ${req.originalUrl} → ${res.statusCode} (${durationMs}ms)`;
      if (res.statusCode >= 400) {
        Logger.warn(message);
      } else {
        Logger.log(message);
      }
    });

    next();
  }
}
