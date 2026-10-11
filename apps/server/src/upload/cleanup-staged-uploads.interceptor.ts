import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import * as fs from 'fs';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Удаляет файлы из стейджинга, если запрос завершился ошибкой.
 *
 * Multer пишет файлы на диск до валидации DTO: при невалидном теле хендлер не вызывается,
 * и без этого интерсептора файлы оставались бы во временной папке навсегда.
 * Ставить в @UseInterceptors ПЕРЕД File(s)Interceptor — тогда ошибки пайпов и хендлера проходят через него.
 * После успешного commitToCategory файла в стейджинге уже нет — удалять нечего.
 */
@Injectable()
export class CleanupStagedUploadsInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      catchError((error: unknown) => {
        for (const file of this.stagedFiles(request)) {
          fs.rm(file.path, { force: true }, () => undefined);
        }
        return throwError(() => error);
      }),
    );
  }

  private stagedFiles(request: Request): Express.Multer.File[] {
    const files = request.files;
    const list = Array.isArray(files)
      ? files
      : files
        ? Object.values(files).flat()
        : [];
    return request.file ? [...list, request.file] : list;
  }
}
