# Конвенции REST API (`apps/server`)

Единые правила построения маршрутов, контроллеров и DTO. Любой новый эндпоинт следует этому документу. Отклонение — только с явной пометкой в коде и в этом файле.

Связанные памятки: только методы GET/POST, описания через кастомный `@Swagger`, для любой сущности сначала CRUD, тесты сейчас не пишем.

---

## 1. Именование: всё в единственном числе, как модель Prisma

| Что | Значение |
| --- | --- |
| URL-сегмент | `group`, `organization` — имя Prisma-модели в нижнем регистре (`Group` → `group`) |
| Папка модуля | `src/group/`, `src/organization/` |
| Классы | `GroupController`, `GroupService`, `GroupModule` |
| Файлы | `group.controller.ts`, `group.service.ts`, `group.module.ts` |
| `@ApiTags` | `@ApiTags('group')` — тот же сегмент |

Множественного числа в API нет нигде. `GET /group` возвращает список — это не противоречие, а правило.

`Organization` в UI называется «Кружок»; в коде, маршрутах и swagger — `organization`.

---

## 2. Идентификаторы в пути

- **Свой id сущности** — всегда `:id`.
  `GET /group/:id`, `POST /group/:id/update`.
- **id другой сущности** (в под-маршрутах и связях) — `:<entity>Id` в camelCase, `<entity>` = имя Prisma-модели.
  `POST /organization/:id/member/:userId/update` — `:id` это Organization, `:userId` это User.
  `POST /group/:id/teacher/:userId/update`.
- **id родителя для списка/создания** — НЕ в пути. Передаётся:
  - в `POST` (создание) — обязательным полем тела: `POST /group` body `{ organizationId, name }`;
  - в `GET` (список) — query-параметром: `GET /group?organizationId=5`.

Вложенных путей для CRUD верхнеуровневой сущности нет. `GET /organization/:id/group` — **запрещено**, правильно `GET /group?organizationId=:id`.

---

## 3. Стандартный набор эндпоинтов сущности `X`

| Действие | Маршрут | Примечание |
| --- | --- | --- |
| Список | `GET /x` | фильтры и пагинация — query (раздел 5) |
| Один | `GET /x/:id` | |
| Создать | `POST /x` | все поля + ссылки на родителей в теле |
| Обновить | `POST /x/:id/update` | частичное; `undefined` — не трогаем, `""`/`null` по DTO — очистка |
| Удалить | `POST /x/:id/delete` | soft, если у модели есть `active` / `archivedAt` / `revokedAt`; иначе hard |
| Восстановить | `POST /x/:id/restore` | только для soft-delete: снимает флаг |

`delete`/`restore` — единая пара для мягкого удаления. Отдельные доменные глаголы (`archive`, `revoke`) заводим, **только** если семантика реально другая, чем «скрыть из выдачи».

### soft-delete по сущностям

| Сущность | Поле | `delete` | `restore` |
| --- | --- | --- | --- |
| Organization | `active` | `active=false` (владелец); `restore` — платформенный админ (OrgScopeGuard блокирует неактивный кружок) | `active=true` |
| Group | `active` | `active=false` (это и есть «архив», ФТ-1.4) | `active=true` |
| Enrollment | `archivedAt` | `archivedAt=now()` | `archivedAt=null` |
| ScheduleRule | `activeTo` | `activeTo=today` + снос будущих нетронутых `Lesson` | `activeTo=null` + перегенерация (семантика «завершить правило») |
| Lesson | `status` | hard-delete **только разовые** (`scheduleRuleId=null`) без рассылок; из расписания — `/lesson/:id/cancel` (`status=CANCELLED`) | `/lesson/:id/restore` снимает `CANCELLED` |
| User | `active` | `active=false` | `active=true` |

`Invite` soft-delete поля не имеет → `POST /invite/:id/delete` следует общему правилу «иначе hard» (раздел 3): строка правда удаляется, `restore` не заводим.

`Invite` скоупится по кружку (`organizationId`), не по группе — ссылка на весь кружок сразу, а не на одну группу (`GET/POST /invite?organizationId=`). Закрыть конкретную группу для подключения по ссылке — `Group.closedForInvites=true` (родителя туда добавляет только педагог, `POST /enrollment/:id/parent`).

`POST /invite/redeem` не создаёт членство напрямую — создаёт `JoinRequest(status=PENDING)`, решение принимает владелец через `JoinRequestModule` (`POST /join-request/:id/approve|reject`, `POST /join-request/:id/cancel` — сам заявитель). Прямое вступление в открытую организацию без приглашения (`POST /organization/:id/join`, `isOpen=true`) заявок не создаёт — членство сразу, по продуктовому решению (открытый кружок — без модерации).

`JoinRequest` soft-delete не имеет — `status` (`PENDING/APPROVED/REJECTED/CANCELLED`) сам фиксирует историю, `delete`/`restore` не заводим. Свои заявки во всех кружках — `GET /join-request/mine` (см. раздел 10, тот же характер исключения, что `user/me`).

---

## 4. Доменные действия (не CRUD)

`POST /x/:id/<verb>` — `<verb>` императив, одно слово, нижний регистр: `cancel`, `move`, `pin`, `unpin`, `transfer`.
Многословный глагол — kebab-case: `allow-messages`, `bulk-cancel`.

**Массовые операции:** `POST /x/bulk-<verb>`, тело `{ ids: number[], … }`.

---

## 5. Связи и под-коллекции

Если связанная сущность — **самостоятельная Prisma-модель со своим контроллером и жизненным циклом** → она верхнеуровневая, доступ к ней через свой контроллер с query-фильтром:
`GET /enrollment?groupId=7`, `GET /schedule-rule?groupId=7`.

Если это **join-таблица / связь, осмысленная только внутри родителя** (роли, состав, прочтения) → под-маршрут родителя:

| Действие | Маршрут |
| --- | --- |
| Список связей | `GET /organization/:id/member` |
| Добавить | `POST /organization/:id/member` — тело `{ userId, … }` |
| Изменить/убрать | `POST /organization/:id/member/:userId/update` — тело `{ role?, remove? }` |

Под-сегмент называется по смыслу связи (`member`, `teacher`, `roster`, `parent`), id в нём — по чужой сущности (`:userId`).
Отзыв связи — не отдельный `/delete`, а `remove: true` в теле `update` (у связей нет «восстановления»).

Исключение — **состав занятия** (`LessonRoster`): не построчный CRUD, а замена набором.
`GET /lesson/:id/roster` (эффективный состав), `POST /lesson/:id/roster` (`{calledChildUserIds}` \| `{presetId}` — снапшот + `rosterFinalizedAt`), `POST /lesson/:id/roster/reset` (назад к «вызваны все активные»).

---

## 6. Query-параметры

Единый DTO пагинации (`PaginationQueryDto`): `page` (≥1, деф. 1), `limit` (1..1000, деф. 25), `sortBy` (деф. `createdAt`), `order` (`asc|desc`), `search` (строка).

Фильтр по родителю — `<entity>Id`: `?organizationId=`, `?groupId=`.
Прочие фильтры — явными query-полями в отдельном `*QueryDto extends PaginationQueryDto`.

Персональные данные в query — запрещено (см. общие правила приватности).

---

## 7. Guards и доступ

Порядок: `@UseGuards(MultiAuthGuard, <ScopeGuard>)`, затем метадата `@RequireOrgRole(...)`.

| Guard | Резолвит id из | Назначение |
| --- | --- | --- |
| `MultiAuthGuard` | заголовки | аутентификация, кладёт `request.user` |
| `PlatformAdminGuard` | `request.user` | только `isPlatformAdmin` |
| `OrgScopeGuard` | `params.id` / `params.organizationId` / `body.organizationId` / `x-organization-id` / `query.organizationId` | членство в кружке (Organization) + роль |
| `GroupScopeGuard` | `params.id` / `params.groupId` / `body.groupId` / `x-group-id` / `query.groupId` | наследует доступ от кружка группы (`Group.organizationId`) |
| `ResourceScopeGuard` + `@ResourceScope('enrollment'\|'invite'\|'inviteRedemption'\|'joinRequest'\|'scheduleRule'\|'lesson'\|'rosterPreset'\|'announcement')` | `params.<key>` / `params.id` / `body.<key>` / `x-<kebab>-id` / `query.<key>` | наследует доступ от `<entity>.group.organizationId` (кроме `invite`/`joinRequest` — там `<entity>.organizationId` напрямую, ссылка кружковая); кладёт `request.<key>` + `groupId` (если есть у сущности) |

`@RequireOrgRole(OrgRole.TEACHER)` — минимальная роль; `OWNER` проходит везде, где нужен `TEACHER`. `isPlatformAdmin` проходит всегда.

Правило выбора guard: маршрут скоупится по самой конкретной сущности в нём. `GET /group/:id` → `GroupScopeGuard`. `GET /group?organizationId=` и `POST /group` (body.organizationId) → `OrgScopeGuard`.

**Не плодить per-entity scope-гварды.** Любая leaf-сущность с `groupId` → добавить ключ в мапу `RESOURCES` в `resource-scope.guard.ts` и вешать `@ResourceScope('<name>')`. Отдельный гвард-файл — только если резолв кружка реально другой.

---

## 8. DTO и Swagger

- `dto/create-<entity>.dto.ts`, `dto/update-<entity>.dto.ts`, `dto/<entity>.response.dto.ts`. Под-DTO связей — `dto/<relation>.dto.ts`.
- Все поля с `class-validator` + `@ApiProperty` / `@ApiPropertyOptional` (иначе схема пустая).
- Описание ручки — кастомный `@Swagger({ title, body, response, param, query, isArray|plainArray, bearerAuth })`. Сырые `@ApiOperation`/`@ApiBody` не использовать.
- Защищённый эндпоинт — `bearerAuth: true` в `@Swagger` (не отдельный `@ApiBearerAuth`).
- `response` — ВСЕГДА собственный `*ResponseDto`, не Prisma-тип. В нём скрыты чувствительные поля (образец — `PUBLIC_USER_SELECT`).
- Списки: `isArray: true` для пагинированных (`{items, meta}`), `plainArray: true` для полного массива.

---

## 9. Форматы

- Методы — только `GET` и `POST`.
- Ответ всегда обёрнут `BaseResponse` (глобальный интерсептор): `{ data, … }`. Сервис возвращает «голый» объект/массив/`{items, meta}`.
- Тело запроса — `application/json`. Query для фильтров, тело для данных.
- Ошибки — стандартные исключения Nest (`NotFoundException` 404, `ConflictException` 409, `ForbiddenException` 403, `BadRequestException` 400).
- `:id` парсится `ParseIntPipe`. Имя параметра в `@Param(...)` и в `@Swagger({ param })` совпадает с сегментом.

---

## 10. Текущий пользователь и исключения

**Текущий пользователь — не исключение, а под-маршрут `user/me`:**
`GET /user/me` (профиль + capabilities), `POST /user/me/update` (свой профиль), далее `GET /user/me/child`, `GET /user/me/notification-preference` и т.п. `me` — литеральный сегмент, не `:id`.

**Единственное исключение:** `/auth/*` — не сущность, действия аутентификации: `POST /auth/login`, `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/vk/miniapp`, `POST /auth/vk/allow-messages`, `POST /auth/change-password`, `GET /auth/me`. Стиль — `POST /auth/<action>`.

Новое исключение — только через правку этого файла.

---

## 11. Guard и soft-delete

Scope-guard'ы (`OrgScopeGuard` / `GroupScopeGuard`) проверяют доступ (членство + роль). Активность leaf-сущности (`active` / `archivedAt` / `revokedAt`) проверяет сервис, чтобы `restore` был возможен. Исключение: `assertOrgAccess` проверяет `Organization.active` — поэтому `restore` кружка идёт через `PlatformAdminGuard`, а не `OrgScopeGuard`.
Исключение: `assertOrgAccess` всё же блокирует доступ к неактивной **организации** для не-платформенного админа (организация — корень дерева доступа).

## 12. Открытые вопросы

- Пикер пользователей для фронта (`GET /user?search=`) — контроллера пока нет, `UserService.list/findById/create/update/delete/restore` готовы. Поднять `UserController` (admin, `PlatformAdminGuard`), когда появится UI назначения ролей.
- Курсорная пагинация для больших коллекций (сейчас только offset). По необходимости.
