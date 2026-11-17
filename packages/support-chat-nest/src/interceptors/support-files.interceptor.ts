import { SUPPORT_LIMITS } from '@app/support-chat-core'
import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import type { Request } from 'express'
import { catchError, from, mergeMap, type Observable, throwError } from 'rxjs'

import { SupportFileStorage } from '../ports'

/** Поле multipart с вложениями. */
export const SUPPORT_FILES_FIELD = 'files'

/**
 * multer с настройками из SupportFileStorage + уборка временных файлов при любой ошибке.
 * multer пишет файлы до валидации DTO: без уборки невалидный запрос оставлял бы их во временной папке.
 */
@Injectable()
export class SupportFilesInterceptor implements NestInterceptor {
  private multer?: NestInterceptor

  constructor(private readonly files: SupportFileStorage) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Настройки берём у проекта, поэтому миксин multer собираем при первом запросе, а не в декораторе
    this.multer ??= new (FilesInterceptor(
      SUPPORT_FILES_FIELD,
      SUPPORT_LIMITS.attachmentsMax,
      this.files.multerOptions(),
    ))()
    const request = context.switchToHttp().getRequest<Request>()

    return from(Promise.resolve(this.multer.intercept(context, next))).pipe(
      mergeMap(stream => stream),
      catchError((error: unknown) => {
        const uploaded = Array.isArray(request.files) ? request.files : []
        uploaded.forEach(file => this.files.discard(file))
        return throwError(() => error)
      }),
    )
  }
}
