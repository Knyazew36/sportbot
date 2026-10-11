import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OrganizationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.organizationId ? +request.organizationId : undefined;
  },
);
