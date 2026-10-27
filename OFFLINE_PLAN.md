# Полностью автономная работа apps/mobile

## Статус (2026-10-27)

- [x] План согласован
- [x] 401 не стирает офлайн-очередь: причина конца сессии `login | logout | expired` (`packages/api/client/session-events.ts`, `session.ts`, `request.ts` → `clearAccessToken('expired')`)
- [x] Очередь тренировки повторяет запросы на 401 до повторного входа (`packages/api/entities/workout/model/queue.ts`)
- [x] Кэш привязан к аккаунту: `bindSessionUser(userId)` в гварде `apps/mobile/src/app/(app)/_layout.tsx`; вход другим аккаунтом выбрасывает чужую очередь и кэш (`apps/mobile/src/shared/api/query-client.ts`)
- [x] buster персиста зафиксирован `'user:'` — обновление не сбрасывает сохранённую очередь
- [x] Выход с неотправленной очередью — через подтверждение (`apps/mobile/src/pages/me-section/components/LogoutButton.tsx`)
- [x] Сервер этапа 0: миграция `20261027120000_offline_sync` (`clientId` uuid, `updatedAt`, надгробия, журнал `SyncOp`) и модуль `apps/server/src/sync` — `POST sync/push` (обработчиков пока нет, всё `rejected`), `GET sync/pull?since`, `GET sync/catalog?since`
- [ ] Дальше: `api:generate` (orval) → мобилка этапа 0 (expo-sqlite + drizzle, pull-движок, локальные хуки на чтение)

Отступление от плана: вместо `deletedAt` (мягкого удаления) — таблица `SyncTombstone`, её пишет триггер Postgres `sync_tombstone()` на DELETE. Мягкое удаление потребовало бы фильтра `deletedAt: null` во всех запросах веба и бота (жёстких удалений 21 место); триггер ловит и каскады, сервисы не меняются. Каскад от удалённого родителя надгробий не пишет — клиент удаляет детей сам вслед за родителем. Надгробия и `SyncOp` живут 60 дней (крон в `SyncPullService`); курсор старше — pull отдаёт полный снимок.

Обработчики операций подключаются через `SyncPushService.register(type, handler)` из модулей сущностей; обработчик обязан быть идемпотентным по `clientId` (журнал пишется после применения). Отказ сервиса 4xx = `rejected` этой операции, 5xx = ошибка всей пачки (клиент повторит, применённые вернутся из журнала).

Заметки для продолжения:
- Время в колонках без пояса из SQL пишем только как `now() AT TIME ZONE 'UTC'`: `CURRENT_TIMESTAMP` даёт время пояса сессии базы, Prisma читает его как UTC (строки «из будущего» на 3 ч). Так сделаны бэкфилл `updatedAt` и триггер надгробий.
- Миграция `20261027120000_offline_sync` правилась после локального применения (checksum в `_prisma_migrations` обновлён вручную); на прод ещё не уходила.
- `WorkoutSetResponseDto.clientId` стал `string` (не `null`) — после `api:generate` проверить tsc веба и мобилки.
- Проверено на локальной базе: полный снимок активного пользователя ~27 КБ, справочник ~212 КБ (237 упражнений, 124 растяжки); push неизвестного типа → `rejected`.

Ограничение до локальной базы: при протухшем токене гвард уводит на вход; работа офлайн без токена появится с переходом на локальную базу.

## Context
Сейчас мобилка офлайн умеет только писать подходы и завершать уже начатую тренировку: очередь в `packages/api/entities/workout/model/queue.ts` хранится на диске и переживает убийство приложения, сервер отбрасывает дубли по `WorkoutSet.clientId`. Всё остальное требует сети: старт тренировки (id создаёт сервер), замена/добавление упражнений, кулдаун, день/пауза, редактор программ, профиль, статистика. Кэш на диск пишется только для трёх запросов.

Цель: всё приложение работает без сети, включая правки. После появления сети данные сливаются с сервером без потерь.

Решения (согласованы):
- **Local-first + sync**: локальная база на телефоне — источник правды для экранов; доменная логика портируется в `packages/api/lib`; очередь операций + `POST sync/push` и `GET sync/pull?since`.
- **Конфликты**: последняя запись по полю (LWW по времени действия). Операция над удалённым объектом отбрасывается, пользователь видит плашку.
- **Id**: int остаётся первичным ключом, добавляем уникальный uuid `clientId` ко всем изменяемым сущностям.
- **Статистика**: считается на клиенте из локальной истории.
- **Картинки**: упражнения своей программы скачиваются сразу; остальное — кнопками «скачать для офлайна».
- **Порядок**: этапами, тренировка первая. Каждый этап — рабочее приложение.

Всегда онлайн (кнопки офлайн неактивны с подсказкой): авторизация, шаринг, друзья, мессенджеры, публикация, шаблоны и чужие программы, аватар.

## Архитектура

### Сервер (`apps/server`)
1. **Миграция**: `clientId String @unique @db.Uuid` (с дефолтом `gen_random_uuid()` для старых строк) у Workout, WorkoutExercise, WorkoutStretch, Program, Complex, ComplexExercise, PlanDay, Pause, Limitation, StretchExclusion, BodyWeight. `updatedAt` + `deletedAt` (мягкое удаление, чтобы pull отдавал удаления) у этих же таблиц и SportProfile. Индекс `(userId, updatedAt)`.
2. **Модуль `sync`** (controller → service → dto, `@Swagger`, логгер `🔄`):
   - `POST sync/push` — пачка операций `{opId(uuid), type, entity, clientId, payload, at}`. Каждая применяется идемпотентно (`SyncOp` таблица с `opId @unique` — повтор возвращает прошлый результат). Ответ: статус по каждой op (`applied | skipped | rejected` + причина).
   - `GET sync/pull?since=<cursor>` — изменённые с `since` строки пользователя по всем таблицам (+ удалённые), новый курсор. Первый вызов без `since` = полный снимок.
   - `GET sync/catalog?since=` — упражнения, растяжки, мышцы, суставы, теги (общий справочник, ~600 КБ целиком). Меняется редко.
   - Операции переиспользуют существующие сервисы (`WorkoutService`, `ProgramService`, `DayService`, `PauseService`…), только принимая `clientId`/`at` из op. Время действия: `at`, зажатое в разумные рамки (как сейчас `doneAt`/`finishedAt`).
   - LWW: у каждой op есть `at`; поле перезаписывается, если `at` новее последнего изменения этого поля (храним `fieldUpdatedAt` JSON на строке, только для редактируемых полей программ/профиля). Для тренировок конфликтов почти нет — они только дописываются.
3. **Серверная правда для дня**: после push сервер пересчитывает `bindWorkout`/`recalcStreak`/rotation pointer сам (как при обычном finish). Клиент считает то же локально для мгновенного отображения, pull выравнивает.
4. Существующие REST-эндпоинты остаются — веб и бот их используют. Они начинают ставить `updatedAt`/`deletedAt`.

### Общий пакет `packages/api`
- `lib/` — чистые функции, портированные с сервера (без Prisma, на массивах):
  - `time.ts` (из `bot/bot-time.ts`: localToday, addDays, weekStart, weekdayOf)
  - `workout.ts` — buildWorkout(complex, profile, today), isValidSet, isDone, canComplete, workoutTotals, timing, lastResult, analogs, defaultPlan (уже есть `measure.ts`)
  - `cooldown.ts` — rankMuscles, pick, byFlow, exclude-замена (random через параметр)
  - `day.ts` — stateOf, markOf, nextTrainingDate, complexOfDay, bindWorkout, recalcStreak, markMissed, lazy-создание PlanDay вместо крона
  - `program.ts` — advance, repairPointer, reorder, superset (есть `superset.ts`)
  - `stats.ts` — betterSet, bestSetOf, progressOf, statusOf, e1rmOf, recordRows, muscle-load, attendance
  - `warmup.ts`
- Сервер **пока не** импортирует их (дублирование, как сейчас с `measure.ts`); позже можно перевести сервер на общий код по образцу `packages/render-contract`. Покрываем эти функции тестами-сверками с серверными на одинаковых входах (по запросу пользователя — см. «Проверка»).
- `sync/` — клиент синка без привязки к хранилищу: типы операций, `push`, `pull`, ретраи (`isRetryableError` из `client/api-error.ts`).

### Мобилка (`apps/mobile`)
- **Хранилище**: `expo-sqlite` (SDK 58) + `drizzle-orm` (типизированная схема, миграции в бандле). Таблицы-зеркала серверных + `outbox(opId, type, payload, at, status, attempts)` + `meta(cursor, catalogCursor, userId)`. Файл базы — на пользователя (`sportbot-<userId>.db`), это заменяет сломанный buster.
- **Репозиторий** `src/shared/db/`: схема, миграции, `useLiveQuery` (drizzle) → реактивность экранов.
- **Хуки сущностей в мобилке**: те же имена, что в `@sportbot/api/entities/*` (`useToday`, `useProgram`, `useAddSet`…), но реализация — локальная база. Кладём в `src/shared/local/entities/<entity>`. Мутация = транзакция: изменить строки + положить op в outbox → мгновенно на экране. Тосты успеха — через тот же общий механизм (вызов toast из обёртки мутации, `successMessage`/`skipSuccessToast` сохраняем).
- **Sync-движок** `src/shared/sync/`:
  - триггеры: старт приложения, возврат в foreground (`focusManager`), появление сети (`onlineManager`/expo-network), после каждой мутации (debounce 1 с), раз в 5 мин в фоне приложения.
  - порядок: push outbox пачками по 50 (строго по порядку, как scope сейчас) → pull → применить в транзакции (LWW по `updatedAt`, не перетирать строки с неотправленными ops) → маппинг `clientId → serverId`.
  - отклонённые ops: откат локально + запись в `sync_issues` → плашка «N изменений не применилось» в «Я».
  - индикатор: переиспользуем `SyncStatus.tsx`/`useWorkoutSync` (обобщить на всю очередь).
- **Авторизация**: 401 больше **не** очищает базу и outbox. Токен сбрасывается, синк ставится на паузу, приложение работает офлайн с баннером «Войдите, чтобы сохранить на сервер». После входа тем же пользователем — синк продолжается; другим — старая база остаётся на диске под старым userId. Выход из аккаунта явно — предупреждение, если outbox не пуст. JWT 7 дней — добавить продление токена при каждом успешном sync (`POST auth/refresh` или новый токен в ответе pull).
- **react-query** остаётся для онлайн-only экранов (шаблоны, друзья, шаринг, сессия). Persist react-query кэша и `workout/model/queue.ts` удаляются после переноса тренировки (с миграцией: при первом запуске недоставленные мутации из старой очереди конвертируются в ops).
- **Медиа**: `expo-image` с `cachePolicy="disk"`. Сервис `src/shared/media/offline-media.ts`: после pull — `Image.prefetch` всех картинок упражнений и растяжек активной программы (+ аналоги и растяжки кулдауна по её мышцам). Кнопки: «Скачать программу для офлайна» на экране программы, «Скачать весь справочник» в «Я → Офлайн» (с размером и прогрессом), значок «доступно офлайн». Видео — внешняя ссылка, офлайн не нужно.
- **Онлайн-only UI**: хелпер `useOnlineAction()` — кнопка disabled + подсказка «Нужен интернет».

## Этапы

### Этап 0. Фундамент и баги
- [x] Миграция `clientId/updatedAt` + надгробия + модуль `sync` (push пустой, pull + catalog).
- [ ] expo-sqlite + drizzle, схема, sync-движок (только pull), локальные хуки только на чтение для: профиль, sport-user, сегодня, программы, справочник.
- [x] Фикс 401 (не стирать очередь) — сразу, даже до переноса. Плюс привязка кэша к аккаунту и подтверждение выхода.
- [ ] Экран «Я → Офлайн»: статус синка, время последнего, кнопка «Синхронизировать», скачивание справочника.

### Этап 1. Тренировка целиком
- `lib/workout.ts`, `lib/cooldown.ts`. Ops: `workout.start` (clientId, complexClientId, startedAt), `set.add/update/delete`, `item.replace/add/remove`, `warmup.finish`, `cooldown.start/finish/exclude`, `workout.finish/discard/delete`.
- Время действия фиксируется в момент тапа (сейчас `at: new Date()` в mutationFn — баг).
- Перевод страниц `pages/workout*`, `pages/cooldown`, `widgets/workout*` на локальные хуки; снять блокировки `useIsOnline` у замены/отмены.
- Удаление `queue.ts`-пути + конвертер старой очереди.
- Live-уведомление (`modules/workout-live`) не трогаем — сети не касается.

### Этап 2. День и пауза
- `lib/day.ts`, lazy-создание PlanDay и пометка MISSED при открытии приложения (вместо крона офлайн). Ops: `day.pickComplex`, `day.skip`, `day.fix`, `day.reschedule`, `day.evening`, `pause.start/end`. Сервер после push пересчитывает серию и указатель очереди.

### Этап 3. Программы
- `lib/program.ts`. Ops на все мутации редактора (create/rename/delete/activate, complex create/copy/rename/warmup/delete/reorder/makeNext, exercise add/update/delete/reorder/ungroup, resync/dismiss-update). Reorder передаёт список clientId; сервер игнорирует неизвестные/удалённые.
- Prefetch картинок при активации и кнопка «Скачать для офлайна».

### Этап 4. Статистика
- `lib/stats.ts`, все 10 экранов статистики считают из локальной базы (`summary`, `attendance`, `progress*`, `records`, `muscle-load`, `calendar`, `day`, `body-weight`). Статистика друзей — онлайн.

### Этап 5. Профиль и остальное
- Ops: `profile.update`, `timezone.set`, `bodyWeight.add`, `limitation.create/delete`, `stretchExclusion.create/delete`, `onboarding.saveStep/finish`.
- Онлайн-only кнопки через `useOnlineAction()`.

## Критичные файлы
- `apps/server/prisma/schema.prisma`, новый `apps/server/src/sync/*`, сервисы `workout/`, `program/`, `day/`, `plan/`, `pause/`, `profile/`
- `packages/api/lib/*` (новые), `packages/api/sync/*` (новый), `packages/api/client/request.ts` (401)
- `apps/mobile/src/shared/api/query-client.ts`, `apps/mobile/src/app/_layout.tsx`
- новые `apps/mobile/src/shared/db/*`, `src/shared/sync/*`, `src/shared/local/entities/*`, `src/shared/media/*`
- `packages/api/entities/workout/model/queue.ts` (удаляется на этапе 1)
- страницы `apps/mobile/src/pages/*` — замена импортов хуков

## Проверка
- Каждый этап: `tsc -p tsconfig.app.json` (фронт), tsc мобилки и сервера; orval — пользователь сам (миграция → сервер :4003 → `api:generate`).
- Сценарии на устройстве (авиарежим):
  1. Этап 1: без сети стартовать тренировку → подходы → замена → кулдаун → финиш → убить приложение → включить сеть → тренировка на сервере ровно одна, подходы без дублей, время — время тапов.
  2. Повторный push той же пачки (обрыв на ответе) — без дублей (`SyncOp.opId`).
  3. Офлайн-правка программы на телефоне + правка того же поля в Mini App → побеждает более позднее, другое поле не теряется.
  4. Истёк токен с непустой очередью → данные остаются, после входа уходят.
  5. Статистика офлайн совпадает с серверной после синка (сравнить ответы `stats/*` с локальным расчётом).
- Тесты на `packages/api/lib` — только если попросишь (по правилам проекта по умолчанию не пишем); рекомендую хотя бы для `day.ts` и `stats.ts`.
