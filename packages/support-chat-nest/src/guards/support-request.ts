import type { Request } from 'express'

import type { SupportOperator } from '../ports'

/** Что guards модуля кладут в запрос. */
export interface SupportRequest extends Request {
  /** SupportVisitGuard: контакт из токена визита. */
  supportContactId?: number
  /** SupportOperatorGuard: оператор. */
  supportOperator?: SupportOperator
}
