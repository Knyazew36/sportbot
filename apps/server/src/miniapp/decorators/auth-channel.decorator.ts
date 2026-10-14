import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithOrganization } from '@/common/types/request-with-organization';

import { channelOf } from '../miniapp-channel';

// Мессенджер запроса (TELEGRAM / MAX) по стратегии, которая его авторизовала; null — не мессенджер
export const AuthChannel = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) =>
    channelOf(
      ctx.switchToHttp().getRequest<RequestWithOrganization>().authProvider,
    ),
);
