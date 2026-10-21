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
    .addTag('miniapp', 'Mini App: вход')
    .addTag('onboarding', 'Первый запуск')
    .addTag('day', 'Сегодня')
    .addTag('pause', 'Пауза')
    .addTag('workout', 'Тренировка и заминка')
    .addTag('program', 'Программы и шаблоны')
    .addTag('catalog', 'Справочник')
    .addTag('drafts', 'Свои записи справочника')
    .addTag('stats', 'Статистика')
    .addTag('profile', 'Профиль')
    .addTag('limitation', 'Ограничения по суставам')
    .addTag('stretch-exclusion', 'Исключённые растяжки')
    .addTag('body-weight', 'Вес тела')
    .addTag('link', 'Мессенджеры')
    .addTag('social', 'Друзья')
    .addTag('admin', 'Админ: модерация, жалобы, пользователи, импорт')
    .addTag('admin-catalog', 'Админ: справочник')
    .addTag('admin-templates', 'Админ: шаблоны программ')
    .build();
}
