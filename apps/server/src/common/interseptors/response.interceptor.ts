import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Рекурсивно вырезает passwordHash из любых объектов ответа —
// хэш пароля не должен покидать API, каким бы эндпоинтом ни отдавался User
function stripPasswordHash(value: any): any {
  if (Array.isArray(value)) {
    value.forEach(stripPasswordHash);
  } else if (value && typeof value === 'object') {
    if ('passwordHash' in value) {
      delete value.passwordHash;
    }
    Object.values(value).forEach(stripPasswordHash);
  }
  return value;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Проверяем, является ли это контекстом Telegraf
    // if ((context.getType() as string) === 'telegraf') {
    //   return next.handle() // не оборачиваем ответ для Telegram-бота
    // }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Пользователь добавляется MultiAuthGuard

    return next.handle().pipe(
      map((data) => {
        const response: any = {
          status: 'success',
          data: stripPasswordHash(data),
          timestamp: new Date().toISOString(),
        };

        // Добавляем информацию о пользователе, если он аутентифицирован и не исключен
        // if (user) {
        //   response.user = {
        //     id: user.id,
        //     telegramId: user.telegramId,
        //     allowedPhone: !!user.allowedPhone,
        //     role: user.role || null,
        //     username: user.username,
        //     phone: !!user.phone
        //   }
        // }

        return response;
      }),
    );
  }
}
