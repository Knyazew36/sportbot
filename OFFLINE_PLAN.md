# Полностью автономная работа apps/mobile

## Статус (2026-10-27)

- [x] План согласован
- [x] 401 не стирает офлайн-очередь: причина конца сессии `login | logout | expired` (`packages/api/client/session-events.ts`, `session.ts`, `request.ts` → `clearAccessToken('expired')`)
- [x] Очередь тренировки повторяет запросы на 401 до повторного входа (`packages/api/entities/workout/model/queue.ts`)
- [x] Кэш привязан к аккаунту: `bindSessionUser(userId)` в гварде `apps/mobile/src/app/(app)/_layout.tsx`; вход другим аккаунтом выбрасывает чужую очередь и кэш (`apps/mobile/src/shared/api/query-client.ts`)
- [x] buster персиста зафиксирован `'user:'` — обновление не сбрасывает сохранённую очередь
- [x] Выход с неотправленной очередью — через подтверждение (`apps/mobile/src/pages/me-section/components/LogoutButton.tsx`)
- [x] Сервер этапа 0: миграция `20261027120000_offline_sync` (`clientId` uuid, `updatedAt`, надгробия, журнал `SyncOp`) и модуль `apps/server/src/sync` — `POST sync/push` (обработчиков пока нет, всё `rejected`), `GET sync/pull?since`, `GET sync/catalog?since`
- [x] Миграция `offline_sync` применена на локальную базу, `prisma generate`, `api:generate` (2026-10-28): `generated/sync/*`, `WorkoutSetResponseDto.clientId: string`; tsc сервера и веба чистые, у мобилки 3 старые ошибки (`Wizard.tsx` hint, ref в `shared/theme`), к синку не относятся
- [x] Мобилка, фундамент (2026-10-28): `expo-sqlite` + `drizzle-orm@0.45` (стабильная, не rc), схема-зеркало `src/shared/db/schema.ts` (+ `meta`, пустой `outbox`), миграции `yarn db:generate` → `src/shared/db/migrations` (babel inline-import + `.sql` в metro). База на пользователя `sportbot-<userId>.db`, `DbProvider` в гварде `(app)/_layout.tsx` — не блокирует экран, без базы всё работает по REST
- [x] Pull-движок `src/shared/sync`: pull + catalog параллельно, применение одной транзакцией (снимок / изменения / надгробия с каскадом детей), строки с неотправленными ops не трогаются; триггеры — старт, foreground, сеть, вход, раз в 5 мин
- [x] «Я → Офлайн» (`pages/me-section/components/OfflineSection.tsx`): статус, время обмена, «Обновить», скачивание картинок справочника в дисковый кеш expo-image с прогрессом
- [ ] Нужна новая dev-сборка (нативный модуль expo-sqlite) и проверка на устройстве: первый снимок, повторный pull, авиарежим
- [x] Локальные хуки на чтение (2026-10-28), `src/shared/local/entities/{profile,day,program,catalog}`: `useLocalQuery` — обычный useQuery, читает базу, без снимка — REST; изменение базы (`addDatabaseChangeListener` в `SyncRunner`) перечитывает ключи `['local', …]`; любая успешная мутация зовёт `requestSync()` (MutationCache в `query-client.ts`)
  - Сервер: в pull добавлены `avatarUrl`/`timeZoneTitle` профиля (профиль отдаётся всегда), вид программы (описание, теги, публикация, `fromFriend`/`fromTemplate`/`sourceUpdated`, `addedCount`), `rescheduleOfferedAt`/`eveningAskedAt` дня; признаки копии вынесены в `program/program-source.ts`. Локальная миграция `0001_pull_view_fields`
  - Пакет: `lib/time.ts`, `lib/day.ts` (порт чистой части `DayService.today`), `lib/catalog-search.ts` (копия серверного `normalizeName`)
  - На базе: «Сегодня», меню «Я», списки программ, активная программа, справочник и карточки (черновики — с сервера), шторки и итог тренировки
  - Остались на REST — экраны частых правок: `MeSectionPage`, `ProgramEditorPage`, `ComplexPage`, `AddExercisePage`. Из базы правка видна только после pull — переключатели и перетаскивание дёргались бы. Переводятся вместе с локальными мутациями (этапы 3 и 5)
  - `useSportUser` остался REST (persist): база открывается по его `userId`
  - Зависшая тренировка прошлых дней на «Сегодня» уже не «идёт» — сервер закрывает её сам (`autoCloseStale` в REST today и утреннем кроне)
- [x] Сверка на dev-базе (2026-10-28, userId=1: 4 программы, 1 тренировка): pull + catalog применены кодом мобилки поверх `node:sqlite` (прослойка с API expo-sqlite), повторный pull тех же строк, затем readers сравнены с REST по каждому полю — profile, today, список и 4 программы целиком, мышцы, суставы, выдача справочника (страница, поиск, мышца + инвентарь, 2-я страница растяжек), карточки. Расхождений нет. Мало тренировок — недельные отметки и «в процессе» на богатой истории не проверены

Заметка: `expo-sqlite` лежит и в корневом `node_modules` (рядом с поднятым drizzle-orm), но там нет `expo-modules-core`. Импорт принудительно ведётся на копию мобилки: `resolveRequest` в `metro.config.js` и `paths` в `tsconfig.json`.

### Хвосты этапов — сделано (2026-10-28)

- [x] Сняты устаревшие блокировки «нужна сеть» у замены упражнения и отмены тренировки (`ExerciseCard`, `InProgressDay`, `EmptyWorkout`, кнопка «Завершить» пустой тренировки) — они давно идут через базу телефона
- [x] `shared/lib/hooks/use-online-action.ts`: кнопка гаснет без сети с подписью «… · нужна сеть». Подключено: поделиться программой и тренировкой, публикация и снятие, обновление копии и «Не сейчас», копирование комплекса, фото профиля (камера на карте, «Убрать», «Взять из мессенджера»)
- [x] Картинки активной программы (упражнения + растяжки на те же мышцы) молча докачиваются после каждого удачного синка (`prefetchProgramMedia` в `engine.ts`); набор запоминается в `meta.programMedia` — без изменений сеть не трогается. Отдельная кнопка «Скачать программу» не нужна
- Старая очередь react-query (`registerWorkoutQueue`) оставлена намеренно: дошлёт застрявшее со старой версии; веб её использует
- Стенды прошлых сессий (`offline-*.ts`, `push-*check.mjs`, `compare-stats.ts`) лежат в scratchpad сессии `2e949660…` — основа для тестов

### Сессия и конфликты — сделано (2026-10-28)

- [x] Продление токена: `POST auth/refresh` (`AuthResponseDto`), мобилка после удачного синка просит новый, если токену больше суток (`shared/sync/refresh-token.ts`, iat из JWT). Новая причина смены сессии `refresh` — не вход и не выход, лишний синк не запускает
- [x] Протухший токен не выкидывает на вход: аккаунт известен (id в MMKV стирает только выход) и профиль сохранён — работаем офлайн (`useSessionExpired`, гвард `(app)/_layout.tsx` ждёт чтения персиста). Плашка «Сессия закончилась · Войти» на «Сегодня» и в «Я» (`widgets/session-expired`); фоновые 401 REST не тостятся
- [x] «Последняя запись побеждает» по полю: колонка `fieldUpdatedAt` (jsonb) у `SportProfile`, `Program`, `Complex`, `ComplexExercise` (миграция `20261028120000_field_updated_at`). Отметки ставят сами сервисы (`ProfileService.update`, `ProgramService.rename/renameComplex/setComplexWarmup/updatePlan`) — веб, бот и синк одинаково; слияние `jsonb ||` в базе (`sync/field-stamps.ts`). Операции `profile.update`, `timezone.set`, `program.rename`, `complex.update`, `complexItem.update` применяют только поля, не правленные позже `at`; все устарели — skipped «Изменено позже на другом устройстве». План упражнения отмечается целиком (`plan`)
- [x] Стенд `lww-check.mjs` на dev-сервере (userId=1, данные возвращены): refresh, частичное применение профиля, skipped программы и плана, комплекс — название веба + разминка телефона — 15/15
- orval снова выкинул `max/*` (MAX локально не поднят) — возвращены из git

> Порядок по решению пользователя (2026-10-28): сначала доделать все этапы 2–5, потом обложить тестами весь офлайн-код (пакет `lib/*`, локальный слой мобилки на `node:sqlite`, обработчики синка сервера; в сервере уже есть vitest).

### Этап 4 — сделано (2026-10-28), ждёт сверки с сервером

- [x] Пакет: `lib/stats.ts` — порт `StatsService`/`StatsAppService`: посещаемость, нагрузка на мышцы, прогресс (точки, рост, «стоит», 1ПМ), список прогресса, история с рекордами, лента рекордов, отметки календаря; помощники рекордов из `lib/records.ts` открыты
- [x] Сервер: в pull профиля — `createdAt` (баланс мышц новичка); локально — миграция `0006_profile_created`
- [x] Мобилка: `shared/local/entities/stats` — сводка, посещаемость, прогресс, история упражнения (страницами), рекорды, вес тела, баланс мышц, календарь, день; статистика друга (`userId`) — с сервера
- [x] Сверка с ответами `stats/*` сервера (`compare-stats.ts`, userId=1): сводка, посещаемость, список прогресса, рекорды, вес, баланс мышц, календарь, день, прогресс упражнения, история — совпало. Истории мало (1 тренировка): «растёт/стоит» и рекорды на долгой истории не проверены

### Проверка на сервере этапов 2, 3, 5 — сделано (2026-10-28)

- `offline-all.ts` собирает очередь кодом мобилки (партия A — создание и правки, B — уборка и возврат настроек), `push-all-check.mjs` отправляет и сверяет pull с телефоном. Флаг `--with-day` у генератора добавляет необратимое (ответ дня, перенос, пауза, вес за сегодня)
- [x] Без `--with-day`: A 14/14 applied, повтор — те же ответы, программа на сервере совпала с телефоном (комплексы, разминка, порядок, план, суперсеты), ограничение, исключение, настройки; B 8/8 applied — всё убрано и возвращено
- [ ] Операции дня, паузы и веса на сервере не гонялись (необратимы для dev-базы) — проверены кодом сервера и стендом телефона

### Этап 3 — сделано (2026-10-28), ждёт проверки push на сервере

- [x] Сервер: `program/program-sync.service.ts` — 15 операций (`program.create/rename/delete/activate`, `complex.add/update/delete/reorder/makeNext`, `complexItem.add/update/delete/reorder/ungroup`, `superset.ungroup`), DTO `program/dto/sync/*`; `ProgramService.create/addComplex/addExercises` принимают clientId. Порядок — список clientId: неизвестные пропускаются, отсутствующие на телефоне встают в конец
- [x] Мобилка: `shared/local/entities/program/write-program.ts` (порт `ProgramService`: cleanName, checkPlan, normalizeSupersets, repairPointer, setNext с переносом на сегодняшний день), хуки редактора в `api.ts`; `localId` у программ, комплексов и упражнений комплекса (миграция `0005`); редактор, комплекс, подбор упражнений — на базе телефона
- [x] Онлайн-действия своей программы (`online.ts`: публикация, снятие, ссылка, обновление копии, «не сейчас», копирование комплекса) подменяют отрицательный id на серверный; не дошедшая до сервера программа — понятная ошибка
- [x] Стенд `offline-program.ts` — 25/25
- Онлайн остаются: каталог и шаблоны, «Взять», программа по ссылке, публикация — им нужен сервер

### Этап 5 — сделано (2026-10-28), ждёт проверки push на сервере

- [x] Сервер: `profile.update` (тот же `UpdateProfileDto`), `timezone.set` (город из списка или `Etc/GMT±N`), `bodyWeight.add` (за дату с телефона, upsert по дню), `limitation.create/delete` (по clientId), `stretchExclusion.create/delete`; `cooldown.exclude` передаёт clientId исключения. Сервисы получили clientId: `BodyWeightService.recordFromClient`, `LimitationService.add/addByUser(..., clientId)`, `cancelByClientId`, `StretchExclusionService.ensure(..., clientId)`
- [x] Пакет: `lib/timezone.ts` (CITY_ZONES, zoneTitle, parseUserTime, zoneFromLocalTime)
- [x] Мобилка: `shared/local/entities/profile` — `write-profile.ts`, `read-lists.ts`, хуки профиля, пояса, городов (список в приложении), веса, ограничений, исключённых растяжек; `MeSectionPage` и разделы «Я» на базе телефона; `localId` у ограничений (миграция `0004`)
- [x] Стенд `offline-profile.ts` — 16/16
- Упрощение плана: LWW по полю не сделан — правка профиля применяется в порядке очереди, дошедшая позже побеждает (нужен `fieldUpdatedAt` на сервере)
- Онбординг остаётся онлайн: идёт сразу после регистрации, а последний шаг копирует шаблон программы на сервере
- Фото профиля — онлайн (REST), `avatarUrl` приезжает pull

### Этап 2 — сделано (2026-10-28), ждёт проверки push на сервере

- [x] Сервер: `day/day-sync.service.ts` (`day.pick/skip/evening/reschedule/fix`), `pause/pause-sync.service.ts` (`pause.start/end`), DTO `day/dto/sync/*`, `pause/dto/sync/*`. День ищется по дате с телефона (ответ офлайн доходит позже), а заводится с clientId телефона; `PollService` и `DayService.pickComplex` получили дату и clientId; простая тренировка вечернего «да» и исправления — с clientId телефона (`completeFromPlan(..., clientId)`); пауза — с clientId телефона. День уже не ждёт ответа — skipped
- [x] Мобилка: `shared/local/entities/day/write-day.ts` (порт `PollService`, `markMissed`, `PauseService`), хуки дня и паузы в `day/api.ts`; `completeInTx` вынесен из `finishWorkout`; `localId` у дней и пауз (миграция `0003_day_local`); push кладёт серверные id дням и паузам, свою копию дня без id убирает (день завёл крон — pull привезёт серверный)
- [x] Стенд `offline-day.ts`: выбор комплекса, пропуск, перенос, исправление на «была» и на «пропуск», вечернее «да»/«нет», предложение паузы, пауза до даты, продление, снятие — 21/21
- [ ] Ленивая пометка MISSED вместо крона офлайн не делалась: неделя на «Сегодня» и так показывает прошедший PENDING пропуском (`markOf`), сам день закроет крон
- [ ] push этапа 2 на dev-сервер — вместе с проверкой следующих этапов

### Этап 1 — сделано (2026-10-28), ждёт проверки на сервере и устройстве

- [x] Пакет: `lib/workout-timing.ts`, `lib/cooldown.ts` (порт сборки и замены заминки), `lib/records.ts`, в `lib/measure.ts` — `defaultPlan`, `isValidSet`, `setError`; в `lib/day.ts` — `streakOf`, `advanceQueue`
- [x] Мобилка: `src/shared/local/entities/workout` — чтение (`read-workout.ts`: тренировка, текущая, итог с рекордами и таймингом, заминка, аналоги), правки с очередью (`write-workout.ts`), хуки с прежними именами (`api.ts`); push в движке (`apply-push.ts`), отказы — `meta.issues` + полный pull, плашка в «Я → Офлайн»; миграция `0002_workout_local`
- [x] Сервер: `workout/workout-sync.service.ts` — 16 операций через `SyncPushService.register`, payload по DTO `workout/dto/sync/*`, `WorkoutService.startFromClient`, `addItems(..., clientIds)`, `CooldownService.saveFromClient/excludeFromClient`, `sync/sync-payload.ts`
- [x] Экраны тренировки, заминки, итога, правки из статистики, полоса тренировки и «не предлагать» переведены на локальные хуки (импорт `@/shared/local/entities/workout`)
- [x] Прогон кодом мобилки на `node:sqlite` (данные userId=1): старт офлайн, повтор старта, подходы с повтором clientId, правка, удаление с перенумерацией, отказ неверного подхода, аналоги, замена, добавление, разминка, завершение (день DONE, серия), заминка, итог — 18/18
- [x] Отправка этой очереди на dev-сервер (`push-check.mjs`): 10/10 applied, повтор пачки — те же ответы из журнала (ids в jsonb — порядок ключей другой, сравнивать без порядка), тренировка одна, время старта и подходы — телефонные, заминка телефонная. Внеплановую сервер привязал к ближайшему будущему дню — телефон эту привязку не делает, она приходит pull
- [ ] Новая сборка и сценарий 1 из «Проверки» на телефоне

### Этап 1 — проект

- **id на экране**: строка, созданная на телефоне, получает `localId` (отрицательное целое) и живёт с ним всегда; DTO берёт `localId ?? id`, поиск по `id` или `localId` — маршрут `/cooldown/-3` не ломается, когда push выдаст серверный id. upsert pull не трогает колонки, которых нет в строке pull (`localId`)
- **outbox.touched** — все clientId, которые создаёт или трогает операция (старт создаёт и упражнения): pull и снимок их не перетирают и не удаляют
- **Операции** (payload по clientId, время — `at` операции): `workout.start` {complexClientId, date, items[{clientId, exerciseId, position, plannedSets, repsMin, repsMax, superset}]}, `set.add/update/delete`, `item.done`, `item.replace` {exerciseId, inComplex}, `item.add` {items[{clientId, exerciseId}], inComplex}, `item.remove`, `warmup.finish`, `cooldown.build` {stretches[{clientId, stretchId, block, position}]}, `cooldown.exclude` {rowClientId, stretchId, nextStretchId}, `cooldown.start/finish`, `workout.finish`, `workout.discard`, `workout.delete`
- **Заминка** собирается на телефоне при завершении (порт `CooldownService.build`), `cooldown.build` уходит до `workout.finish` — сервер в `complete` видит сохранённый набор и свой не собирает. skipped у `cooldown.build` (сервер успел собрать свой) — локальные растяжки тренировки удаляются, pull привезёт серверные
- **Сервер**: обработчики в `workout/workout-sync.ts` через `SyncPushService.register`; старт при чужой идущей тренировке (начата в боте) — её закрываем (`autoClose`-логика), офлайн-тренировка важнее
- **rejected** — операция снимается, ошибка в `meta.issues`, следующий pull полный: телефон возвращается к серверной правде, неотправленное остаётся
- Старая очередь react-query (`queue.ts`) остаётся только чтобы дослать застрявшее со старой версии; новые подходы в неё не идут
- Итог офлайн: totals, тайминг, рекорды по локальной истории (порт `StatsService.records`), серия — из профиля, пока pull не привезёт пересчитанную

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
