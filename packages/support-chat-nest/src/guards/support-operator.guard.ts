import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'

import { SupportIdentity } from '../ports'

import type { SupportRequest } from './support-request'

/** Ставить после SupportHostAuthGuard: тот кладёт пользователя проекта, здесь решаем, оператор ли он. */
@Injectable()
export class SupportOperatorGuard implements CanActivate {
  constructor(private readonly identity: SupportIdentity) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SupportRequest>()
    const operator = await this.identity.resolveOperator(request)
    if (!operator) {
      throw new ForbiddenException('Нет доступа к чату поддержки')
    }
    request.supportOperator = operator
    return true
  }
}
