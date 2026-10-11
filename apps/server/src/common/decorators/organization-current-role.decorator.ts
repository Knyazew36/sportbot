import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { RequestWithOrganization } from '../types/request-with-organization';

// Роль текущего пользователя в организации запроса — проставляет OrgScopeGuard.
export const OrganizationCurrentRole = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOrganization>();

    return request.orgRole ?? null;
  },
);
