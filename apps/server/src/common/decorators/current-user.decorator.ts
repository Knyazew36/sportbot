import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { User } from '@/generated/prisma/client';

import { RequestWithOrganization } from '../types/request-with-organization';

// Текущий аутентифицированный пользователь (проставлен MultiAuthGuard).
// `@CurrentUser()` — весь User, `@CurrentUser('id')` — одно поле.
export const CurrentUser = createParamDecorator(
  (field: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithOrganization>();
    const user = request.user;

    return field ? user?.[field] : user;
  },
);
