# Server — шаблон бэкенда

NestJS 12 + Prisma 7 + PostgreSQL. В шаблоне только то, что нужно в каждом проекте; доменные модули добавляются поверх.

## Что внутри

| Модуль | Назначение |
| --- | --- |
| `auth` | Регистрация и вход по email, подтверждение почты, сброс и смена пароля, удаление аккаунта |
| `user` | Свой профиль и аватар; CRUD пользователей для платформенного админа; слияние аккаунтов |
| `organization` | Организации, участники, роли `OWNER / ADMIN / MEMBER`, передача владения |
| `invite`, `join-request` | Ссылки-приглашения и заявки на вступление с одобрением |
| `notifications` | Лента уведомлений, каналы (email, Telegram, MAX, VK, in-app), настройки по событиям |
| `messengers` | Боты Telegram / MAX / VK: вход через бота, привязка, мини-приложения, отправка сообщений |
| `mail` | Письма через Resend |
| `upload` | Загрузка и раздача файлов |
| `audit-log` | Журнал мутаций в организации (пишется автоматически, хранится 90 дней) |
| `chat` | Публичная форма обратной связи с сайта |
| `common` | Гварды, декораторы, конфиги, пагинация, `@Swagger` |

## Запуск

```bash
cp .env.example .env            # заполнить DATABASE_URL, JWT_SECRET, RESEND_API_KEY, MAIL_FROM
npx prisma migrate deploy       # применить миграции
npx prisma generate
npx prisma db seed              # платформенный админ из PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD
npm run dev
```

Swagger: `http://localhost:4003/api/docs`.

## Как расширять

- **Новый модуль** — папка `src/<name>/` (`controller` → `service` → `dto/`), подключить в `app.module.ts`.
- **Сущность внутри организации** — `@UseGuards(MultiAuthGuard, OrgScopeGuard)` и `@RequireOrgRole(...)`;
  для доступа по `:id` самой сущности добавить её в `ResourceScopeGuard` (`common/guards/resource-scope.guard.ts`).
- **Права** — субъекты и правила в `common/casl/` (`ability.types.ts`, `ability.factory.ts`).
- **Событие уведомления** — запись в `notifications/event-registry.ts`, затем
  `NotificationsService.notifyOrganization(...)` или `notifyUser(...)`. Миграция не нужна.
- **Мессенджеры** — задать env бота, и модуль подключится сам. Свои кнопки и команды — в
  `messengers/adapters/app-*.adapter.ts`. Подробности: `src/messengers/README.md`.
- **Слияние аккаунтов** — если новая сущность ссылается на `User`, дописать её перенос в `UserService.mergeUsers`.
- **Эмодзи логов** — новый домен добавить в `common/utils/log-emoji.ts`.
