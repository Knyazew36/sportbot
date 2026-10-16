# Время тренировки: подходы, отдых, простой, заминка

## Context
Сейчас в БД есть только `Workout.startedAt`/`finishedAt`, длительность считается в `workoutTotals()`.
Секундомер подхода (`useStopwatch`) и таймер отдыха (`useDeadlineTimer`) живут только в localStorage и при записи подхода пропадают.
Нужна полная картина тренировки: сколько длился каждый подход, сколько отдыхал (и сколько планировал), переходы между упражнениями, простои, заминка.
Решения пользователя: подходы, отдых, план отдыха и заминка (кардио не трогаем); показываем на итоге и в протоколе; разрыв больше порога считается простоем.

## Принцип
Время с клиента: подходы идут через офлайн-очередь и доезжают позже, поэтому серверное `now()` неверно (как уже сделано с `finishedAt`).
Храним только факты на подходе, а отдых, переходы и простой выводим из шкалы времени, без отдельной таблицы событий.

## 1. Схема (`apps/server/prisma/schema.prisma`)
`WorkoutSet`:
- `doneAt DateTime?`: когда нажали «Готово»/записали; null у старых строк.
- `workSeconds Int?`: чистое время подхода по секундомеру (паузы на ввод уже вычтены хуком); null при ручном вводе и из бота.
- `restTargetSeconds Int?`: план отдыха перед подходом = `timer.total` (настройка + все «+30 с»); null, если таймер не запускали.

`Workout`: `cooldownStartedAt DateTime?`, `cooldownFinishedAt DateTime?`.

Миграция `prisma/migrations/2026101710xxxx_workout_timing`: колонки nullable **без default**, чтобы старые подходы не получили фальшивое время миграции.

## 2. Сервер
- `dto/create-workout-set.dto.ts`: опциональные `doneAt` (`IsISO8601`), `workSeconds` и `restTargetSeconds` (`IsInt`, 0..3600).
- `workout.service.ts`:
  - `addSetValues`/`createSet` получают `timing`.
  - Если тренировка закрыта (правка из статистики), timing отбрасываем и пишем null.
  - `doneAt` ограничиваем: не раньше `workout.startedAt` и не позже now, как в `workout-app.service.ts:137`.
  - Без `doneAt` (бот, `addSet`) ставим `new Date()`.
  - Повтор по `clientId` не трогаем.
- Новый чистый `workout-timing.ts` рядом с `workoutTotals()`, функция `workoutTiming(workout)`:
  - Подходы с `doneAt` сортируем по времени. Начало подхода = `doneAt − workSeconds`; без `workSeconds` начало неизвестно, и разрыв перед подходом идёт в «прочее».
  - Разрыв между соседними подходами:
    - больше `IDLE_GAP_SECONDS = 600`: `idle`;
    - то же упражнение: `rest`;
    - другое упражнение: `transition`.
  - Ещё в разбивку входят `warmup` (старт → первый подход), `tail` (последний подход → `finishedAt`), `work` = Σ `workSeconds`, `restTarget` = Σ план у тех же пар, `cooldown` = `cooldownFinishedAt − cooldownStartedAt`.
  - Для каждого подхода считаем `restBeforeSeconds` (null, если это переход или простой).
  - Если подходов со временем нет, возвращает `null`: старые тренировки и SIMPLE.
- `finish`: `finishedAt` дополнительно не раньше последнего `doneAt`.
- DTO:
  - `workout-set.response.dto.ts`: `doneAt`, `workSeconds`, `restTargetSeconds`, `restBeforeSeconds`.
  - Новый `workout-timing.response.dto.ts`.
  - `workout-summary.response.dto.ts`: поле `timing: WorkoutTimingResponseDto | null`.
  - Маппинг в `workout-app.service.ts` (~строка 348 и `summary`).
- Заминка: `POST cooldown/start/:id` и `POST cooldown/finish/:id` в `workout.controller.ts` (действия-глаголы).
  - Тело `{ at?: ISO }`, `ParseIntPipe`, `@Swagger`.
  - Сервис пишет через `updateMany` с `where { id, userId, cooldownStartedAt: null }` (идемпотентно, без пред-запроса), `count = 0` → лог `debug`.
- Логи через `Logger` с `workoutId`/`userId`: запись timing, срезанное время (`warn`), заминка.

## 3. Фронт
- `shared/lib/hooks/use-stopwatch.ts`: отдавать `pausedAt` (момент «Готово»).
- `pages/workout/WorkoutPage.tsx`:
  - В `startSet` до `timer.stop()` запомнить `restTarget = timer.status !== 'idle' ? timer.total : null` в localStorage-ключе `set-rest-target-${workout.id}` (переживает перезагрузку, как секундомер).
  - В `SetEntrySheet` передаётся `timing` `{ doneAt, workSeconds, restTargetSeconds }`, если секундомер шёл, иначе `{ doneAt: now }` при сабмите.
  - После `onSaved` ключ чистится.
- `SetEntrySheet.tsx`: `add.mutate({ ..., ...timing, clientId })`. `queue.ts` (`applyEntry`) кладёт `doneAt`/`workSeconds` в оптимистичный подход.
- `entities/workout/api.ts`:
  - `useCooldownStart`/`useCooldownFinish` с `scope: WORKOUT_QUEUE_SCOPE` и временем нажатия.
  - `meta.skipSuccessToast` с комментарием: прохождение заминки видно на экране.
- `pages/cooldown/CooldownPage.tsx`: start при первом переходе в `step`, finish при `done`.
- `widgets/workout/SetList.tsx`: у подхода подпись «0:45 · отдых 2:10» (отдых сверх плана выделить), через `formatSeconds` и `Text`/`Eyebrow` из kit.
- `pages/workout/SummaryPage.tsx`: блок «Время»: работа, отдых (средний и против плана), переходы, простой, заминка. Блок скрыт при `timing === null`.

## Проверка
1. `npx prisma migrate deploy` в apps/server → dev-сервер :4003 → `yarn api:generate` во фронте.
2. `tsc -b` на сервере, `tsc -p tsconfig.app.json` во фронте.
3. Вручную в Mini App пройти сценарии:
   - подход секундомером → отдых с «+30» → второй подход → смена упражнения → ручной подход → завершить;
   - на итоге проверить работу, отдых, план и переход;
   - в протоколе проверить подписи у подходов.
4. Офлайн-сценарий: выключить сеть, записать два подхода, через 2 минуты включить сеть. `doneAt` должен совпасть с нажатием, а не с отправкой.
5. Старая тренировка: блок «Время» скрыт, протокол без подписей.
6. Заминка: открыть, пройти, повторно открыть. `cooldownStartedAt` не меняется.
