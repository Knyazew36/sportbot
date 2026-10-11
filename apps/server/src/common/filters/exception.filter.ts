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
import { isDevEnv, resolveEntityEmoji } from '../utils';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(`🚨 ${AllExceptionsFilter.name}`);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
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
    const line = `${emoji} ${request.method} ${request.url} → ${status}`;
    if (status >= 500) {
      this.logger.error(
        `${line}: ${exception instanceof Error ? exception.message : JSON.stringify(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      // 4xx — ошибка клиента, а не сбой: стек не нужен, error-лог не зашумляем
      this.logger.warn(
        `${line}: ${typeof message === 'string' ? message : JSON.stringify((message as any).message)}`,
      );
    }

    response.status(status).json({
      ...extraFields,
      message: typeof message === 'string' ? message : (message as any).message,
      exception:
        isDevEnv() && exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      status,
    });
  }
}
