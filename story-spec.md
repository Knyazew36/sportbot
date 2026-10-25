# Картинка в сторис: кнопка + шторка с настройками

## Context
Хотим, чтобы результатом тренировки и рекордом можно было поделиться в сторис. Сейчас есть только `ShareWorkoutButton`: бот присылает в чат квадратную карточку 1280×1280 (resvg, `apps/server/src/workout/share-card.ts`). Эта кнопка остаётся как есть. Рядом появляется отдельная кнопка «В сторис». Она открывает шторку с живым превью и настройками.

Решения пользователя:
- **Куда уходит картинка.** В Telegram — `WebApp.shareToStory`, сразу открывается редактор сторис. В MAX, VK и вебе — скачать PNG.
- **Настройки.** Стиль/цвет и выбор цифр. Своего фото пока нет.
- **Чем рисуем.** resvg, вертикальный макет 1080×1920 рядом с квадратным. Remotion не используем.
- **Какие картинки.** «Итог тренировки» и «Рекорд упражнения».
- **Старая кнопка.** Остаётся рядом, не сливаем.

## Как работает
1. Кнопка «В сторис» открывает `Sheet` (снизу). В шторке превью-картинка и под ней настройки.
2. Превью — PNG с сервера: `GET …/preview?<настройки>`, ответ в бинарном виде. Запрос идёт через `$api` с `responseType: 'blob'`, картинка показывается через `URL.createObjectURL`. Смена настроек перезапрашивает превью с debounce ~300 мс. Пока грузится новое, на экране остаётся старое (`placeholderData: keepPreviousData`). Превью совпадает с итогом 1:1.
3. «В сторис» / «Скачать» отправляет `POST …` с теми же настройками. Сервер сохраняет PNG в публичную категорию `uploads/stories/<uuid>.png` и возвращает `{ url, fileName, expiresAt }`. Затем фронт:
   - если Telegram и `isVersionAtLeast('7.8')`, вызывает `shareToStory(toAssetUrl(url))`;
   - иначе вызывает `downloadFile(toAssetUrl(url), fileName)` (уже есть в `shared/miniapp/webapp.ts:214`).
4. Файлы живут 24 часа, потом их удаляет крон.

## Сервер — новый модуль `apps/server/src/story/`
- **`story.controller.ts`** (`@SportAuth()`, у каждого эндпоинта `@Swagger`, id через `ParseIntPipe`):
  - `GET story/workout/:id/preview` — query `StoryWorkoutQueryDto`, ответ `image/png` (отдельный эндпоинт: бинарный формат).
  - `POST story/workout/:id` — body `StoryWorkoutDto`, ответ `StoryFileResponseDto`.
  - `GET story/record/:exerciseId/preview` и `POST story/record/:exerciseId` — то же для рекорда.
  - Эндпоинтов CRUD нет: у сторис нет сущности в БД, есть только действие и бинарный ответ.
- **`story.service.ts`** собирает данные и рисует. Проверки «своя и законченная» делаются в `where` того же запроса, как в `WorkoutShareService.shareable` (`status: { not: 'IN_PROGRESS' }`, `userId`). Если не найдено — `NotFoundException`. Логгер `📸 StoryService`; логируем рендер, сохранение и сбои с `stack`.
- **`story-card.ts`** — два SVG-макета 1080×1920 → `Resvg`:
  - **Итог тренировки:** комплекс и дата, табло выбранных цифр (плитки с жёсткой тенью, как в `share-card.ts`), опционально список упражнений с лучшим подходом, логотип или подпись «Спортбот».
  - **Рекорд:** название упражнения, крупное значение (`65 × 6`, `1:30`), прирост к прошлому рекорду, дата.
  - Сверху и снизу по 250 px оставляем пустыми: там интерфейс сторис (`packages/brand/BRAND.md:72`).
- **Переиспользуем вместо дублирования.** Вынести из `workout/share-card.ts` в `workout/share-svg.ts` общие куски: `FONT_FILES`/`RESVG_FONTS`, `esc`, `cut`, `plural`, `thousands`, `flame`, `PALETTES`. Из `workout-share.service.ts` вынести `bestSet` и `ddmmyyyy`. Также переиспользуем `workoutTotals`, `isDone`, `WORKOUT_INCLUDE` (`workout.service.ts`) и `supersetRuns`.
- **Данные рекорда.** Текущий личный максимум упражнения: значение, дата, прошлый максимум. Берём логику, которую уже считает `stats.service.ts` (`historyRows`, `recordRows`). Вынести её в `public`-метод `StatsService` и вызывать оттуда, не писать заново.
- **DTO** — по одному классу на файл в `story/dto/`:
  - `story-workout.dto.ts`: `style` (IsIn палитр); `show` — массив из `tonnage | minutes | sets | exercises | streak | list` (IsIn, минимум 1).
  - `story-record.dto.ts`: `style`; `show` из `previous | date`.
  - `story-workout-query.dto.ts` и `story-record-query.dto.ts` — те же поля для GET. Массив передаётся строкой через запятую и разбирается `@Transform`.
  - `story-file.response.dto.ts`: `{ url, fileName, expiresAt }`.
- **Палитры.** Сейчас `classic` и `rose` (`share-card.ts:22`). Добавить `mint` и `dark` (тёмный фон) из `packages/brand/tokens.json`. По умолчанию — как сейчас: `rose` для `gender === 'FEMALE'`, иначе `classic`.
- **Файлы.** В `UploadService.PUBLIC_CATEGORIES` (`upload/upload.service.ts:20`) добавить `'stories'` — тогда раздача `/api/uploads/stories` поднимется сама (`main.ts:76`). Сохранять через `saveImageBuffer`/`getCategoryDir`.
- **`story-cleanup.service.ts`.** `@Cron(EVERY_HOUR)` удаляет файлы в `stories/` старше 24 часов по `mtime`. Записей в БД нет. Пример — `render/render-cleanup.service.ts`.
- **`story.module.ts`** подключить в `app.module.ts`. Нужен импорт `StatsModule` (или экспорт `StatsService`) и `UploadModule`.

## Фронтенд
- **`shared/miniapp/webapp.ts`.** В тип `WebApp` (`:28-61`) добавить `shareToStory(media_url: string, params?: { text?: string })` и хелпер `shareStory(url): boolean`: Telegram ≥ 7.8 → `shareToStory`, иначе `false`. `widget_link` не передаём: он работает только у Premium.
- **`entities/story/`** — хуки пишем руками поверх функций orval:
  - `model/schemas.ts` — zod `storyWorkoutSchema` и `storyRecordSchema` (`style`, `show` с `min(1)`) и типы `z.infer`.
  - `model/keys.ts` — ключи превью: `['story','preview',kind,id,settings]`.
  - `api.ts`:
    - `useStoryPreview(kind, id, settings)` — useQuery, blob → objectURL, `revokeObjectURL` при смене картинки, `keepPreviousData`, `staleTime: Infinity`.
    - `useCreateStory(kind)` — мутация с `meta: { skipSuccessToast: true }` и комментарием: результат и так виден, открывается редактор сторис или скачивается файл.
  - `index.ts`.
- **`features/share-story/`:**
  - `StoryButton.tsx` — кнопка `variant='share'`, иконка `lucide` (например `InstagramIcon`/`ImageIcon`), подпись «В сторис». Открывает шторку.
  - `StorySheet.tsx` — `Sheet` + `SheetHeader`. Превью в рамке 9:16. Форма на react-hook-form + `zodResolver`, поля через `Controller`:
    - `Segmented` для стиля (кружки-свотчи цвета);
    - `ToggleGroup multiple` для цифр (`StepDays.tsx` как образец).
    - `watch()` с debounce передаётся в превью.
    - Внизу одна главная кнопка: «Выложить в сторис» в Telegram, «Скачать картинку» в остальных случаях.
  - `useShareStory.ts` — один хук на всё действие: `create` → `shareStory(url)` или `downloadFile`.
- **Где кнопка** (рядом со `ShareWorkoutButton`, не вместо неё):
  - `pages/workout/SummaryPage.tsx` (футер `:36-57`, сейчас грид из двух колонок) — добавить «В сторис» строкой выше грида.
  - `pages/stats-workout/StatsWorkoutPage.tsx` — так же.
  - `pages/workout-result/WorkoutResultPage.tsx` — только для `isOwn`.
  - Рекорд: `pages/stats-exercise/StatsExercisePage.tsx` — `TopBar.action`; `pages/stats-records` — действие в строке `RecordRow`. На чужой статистике (`?userId=`) кнопку скрываем.

## Мои решения (проверьте)
- Превью рендерит сервер, а не фронт: так картинка совпадает с итогом 1:1. Цена — запрос на каждую смену настроек, смягчённый debounce.
- «Рекорд» — это текущий личный максимум упражнения, не конкретная запись из ленты: в строке ленты есть `exerciseId`, но нет `workoutId`.
- Стили: `classic`, `rose`, `mint`, `dark`.
- Ссылку-виджет в сторис не добавляем (только Premium). Позже можно добавить подпись `text`.
- В MAX/VK/вебе картинку только скачиваем. «Прислать ботом в чат» на этом шаге не делаем.

## Порядок работы
1. Вынести общие части из `share-card.ts` в `share-svg.ts`. Проверить, что квадратная карточка не изменилась.
2. Собрать `story-card.ts` и сервис. Быстрая проверка через ts-node: записать PNG в scratchpad и посмотреть глазами.
3. Контроллер, DTO, категорию `stories`, крон.
4. Пользователь сам: `migrate deploy` (миграции нет) → сервер :4003 → `api:generate`.
5. Фронт: `webapp.ts`, `entities/story`, `features/share-story`, кнопки на страницах.

## Проверка
- `tsc` сервера; фронт — `tsc -p tsconfig.app.json`. prettier не запускаю.
- PNG через ts-node для обоих макетов, всех палитр и крайних случаев: длинное название, большой тоннаж, без веса, суперсеты. Проверить пустые зоны по 250 px.
- В Mini App в Telegram: шторка, превью меняется вместе с настройками, «Выложить в сторис» открывает редактор TG с картинкой.
- В вебе и MAX: «Скачать картинку» сохраняет PNG.
- Крон: файл старше 24 часов удаляется.
