import { DocumentBuilder } from '@nestjs/swagger';

// Теги — латиницей (иначе orval генерит названия хуков/файлов кириллицей),
// человекочитаемое описание — вторым аргументом addTag, его показывает Swagger UI.
export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('api')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Авторизация')
    .addTag('user', 'Пользователи')
    .addTag('organization', 'Организации')
    .addTag('invite', 'Приглашения')
    .addTag('join-request', 'Заявки на вступление')
    .addTag('notifications', 'Уведомления')
    .addTag('audit-log', 'Журнал действий')
    .addTag('chat-submission', 'Обратная связь с сайта')
    .build();
}
