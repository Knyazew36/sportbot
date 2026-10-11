import { SetMetadata } from '@nestjs/common';

export const SKIP_AUDIT_KEY = 'skip_audit';

/** Исключить эндпоинт/контроллер из автосбора AuditLogInterceptor — напр. импорт (огромное тело) или заведомо шумные роуты. */
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
