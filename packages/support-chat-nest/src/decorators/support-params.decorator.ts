import { createParamDecorator, type ExecutionContext } from '@nestjs/common'

import type { SupportRequest } from '../guards/support-request'
import type { SupportOperator } from '../ports'

/** id контакта посетителя (проставлен SupportVisitGuard). */
export const VisitContactId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => ctx.switchToHttp().getRequest<SupportRequest>().supportContactId!,
)

/** Текущий оператор (проставлен SupportOperatorGuard). */
export const CurrentSupportOperator = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): SupportOperator =>
    ctx.switchToHttp().getRequest<SupportRequest>().supportOperator!,
)
