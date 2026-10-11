import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

import { RequestWithOrganization } from '../types/request-with-organization';
import { IS_DEV_ENV, resolveEntityEmoji } from '../utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse() as Response;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';
    // Объектный response исключения (напр. new ConflictException({message, code, ...})) может нести
    // доп. поля вроде code — прокидываем их наружу, а не только message, чтобы фронт мог различать
    // варианты одного и того же HTTP-статуса (напр. MERGE_AVAILABLE у обычного 409).
    const extraFields =
      typeof message === 'object' && message !== null ? message : {};

    const request = ctx.getRequest<RequestWithOrganization>();
    const emoji = resolveEntityEmoji(request.url);
    // // request.user/organizationId проставляют MultiAuthGuard/OrganizationAccessGuard до хендлера —
    // // если исключение прилетело не из самого гварда, к моменту фильтра они уже есть.
    // const who = request.user
    //   ? ` user=${request?.user?.id}${request.organizationId ? ` org=${request.organizationId}` : ''}`
    //   : ''

    this.logger.error(
      `${emoji} ${request.method} ${request.url} → ${status}: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
      // `${emoji} ${request.method} ${request.url} → ${status}${who}: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`,
    );

    response.status(status).json({
      ...extraFields,
      message: typeof message === 'string' ? message : (message as any).message,
      exception:
        IS_DEV_ENV && exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      status,
    });
  }
}
