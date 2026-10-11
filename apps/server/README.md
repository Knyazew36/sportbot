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
npx prisma generate             # перед сборкой запускается сам (prebuild), вручную нужен для npm run dev
npx prisma db seed              # платформенный админ из PLATFORM_ADMIN_EMAIL / PLATFORM_ADMIN_PASSWORD
npm run dev
```

Swagger: `http://localhost:4003/api/docs`.

Проверки: `npm run check-types`, `npm run lint` (`lint:fix` — с автоисправлением).

### Схема БД

- Изменил `schema.prisma` → `npx prisma migrate dev --name <что_изменилось>`, папку миграции закоммитить.
- База уже создана через `db push` (без истории миграций): привести её к схеме и один раз пометить
  начальную миграцию применённой — `npx prisma db push && npx prisma migrate resolve --applied 20261011000000_init`.

### Договорённости, которые легко нарушить

- `NODE_ENV=development` включает dev-послабления (стек ошибки в ответе, коды из писем в логах,
  localhost в CORS). На сервере — `production`; это и дефолт, если переменная не задана.
- id организации в хендлере брать из `@OrganizationId()` (его проверил `OrgScopeGuard`), а не из DTO.
- `sortBy` в списках: разрешённые поля — опция `sortable` у `paginatePrisma` (по умолчанию `id`, `createdAt`).
- Загрузка файлов: `@UseInterceptors(CleanupStagedUploadsInterceptor, FileInterceptor(...))`; чтобы категория
  раздавалась по `/api/uploads/<категория>/`, добавить её в `UploadService.PUBLIC_CATEGORIES`.
- Смена и сброс пароля увеличивают `User.tokenVersion` — все ранее выданные JWT перестают действовать.

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
