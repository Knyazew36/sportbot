# Рефакторинг страниц под копию в мобилку + вынос API

> **Статус (2026-10-25):** шаги 1–3 выполнены. `tsc -p tsconfig.app.json` и `vite build` проходят. Следующий шаг — пакет `@sportbot/api` (раздел «Вынос API в пакет»).
> Не тронуто: `app/layouts/RootLayout` (по правилам должен жить в `shared/layouts`), кабинет организаций, админка, редактор.

Цель — чтобы мобильное приложение (`apps/mobile`, Expo) собиралось как копия веба: та же структура папок, та же логика, другая разметка.
Принцип: **логика отдельно от разметки**. Логику (хуки, состояние, переходы) переносим в мобилку как есть, разметку пишем заново на RN.

Не трогаем: админку (`pages/admin`), редактор роликов (`pages/editor`, виджеты `end-card-editor`, `overlay-editor`, `video-*`), developer, ui-витрину, кабинет организаций (`members`, `invites`, `join-requests`, `settings`, `profile`, `notifications`, `dashboard`, `audit-log`, `workspaces`, `invite`).

---

## Правила структуры

```
pages/<page>/
  <Name>Page.tsx      ← тонкий: параметры маршрута, запрос, QueryScreen, раскладка блоков
  model/              ← хуки логики экрана (use-<page>-flow.ts) — переносятся в мобилку без изменений
  components/         ← блоки разметки только этой страницы
widgets/<name>/       ← блок, который используют 2+ страницы
features/<name>/      ← действие пользователя (кнопка/шит + мутация), используется 2+ местами
entities/<name>/      ← запросы, ключи, схемы, чистые функции (без UI) — кандидат в пакет @sportbot/api
```

- Одна страница — одна папка. Папка названа как маршрут: `program-editor`, `workout-replace`.
- В файле страницы нет вложенных компонентов (`const XxxView = …`) — они в `components/`.
- Больше ~3 `useState`/`useEffect` с переходами между ними → хук в `model/`.
- Компонент из `components/` понадобился второй странице → в `widgets/` (или `features/`, если это действие).
- Импорты между страницами запрещены (сейчас их нет — сохраняем).

---

## Аудит: что сейчас

Хорошо: большинство страниц уже разбиты на блоки, импортов между страницами нет, `entities` почти не зависят от UI.

Проблемы:

| # | Где | Что |
|---|---|---|
| 1 | `pages/workout/WorkoutPage.tsx` (667 строк) | `WorkoutView` — машина состояний тренировки на ~500 строк (отдых, разминка, круг суперсета, секундомер, штампы, ключи localStorage) вперемешку с разметкой. Плюс `StartWorkout`, `ElapsedInline` в том же файле |
| 2 | `pages/cooldown/CooldownPage.tsx` (466) | `CooldownView`: фазы overview / step / more + 4 разных экрана разметки в одном компоненте |
| 3 | 6 папок с несколькими страницами | `programs/` (8 страниц), `workout/` (4), `auth/` (5), `library/` (3), `me/` (2), `workout-edit/` (2) |
| 4 | `ExercisePage`, `StretchPage`, `CooldownPage` | Один и тот же блок «инструкции»: описание + шаги + типичные ошибки (+ фото и видео) — три копии |
| 5 | `ExercisePage` (229), `StretchPage` (201), `TemplatesPage` (230), `ReplaceExercisePage` (198), `FriendPage` (185), `OnboardingPage` (189) | Крупные куски разметки внутри страницы (мышцы, шапка, футер с таймером, сортировки) |
| 6 | `auth/ui/AuthLayout` | По правилам проекта лейауты — в `shared/layouts/layout-<name>/Layout<Name>.tsx` |
| 7 | `auth/model/schemas.ts` | По правилам проекта схемы — в `entities/<entity>/model/schemas.ts` |
| 8 | `entities/program/lib.ts` | Тянет `lucide-react`, `ROUTES`, `StatusBadge` — UI внутри сущности, мешает выносу API |
| 9 | `entities/profile/model/gender.ts`, `entities/workout/model/motivation.ts` | Тип `Gender` импортируется из хука `shared/lib/hooks/use-palette` |

---

## Шаг 1. Одна страница — одна папка

Переносы через `git mv` (история файлов сохраняется), затем правка `app/router/routes.ts`.

### programs/ → 8 папок
| Страница | Новая папка | Её компоненты |
|---|---|---|
| ProgramsPage | `programs/` | ActiveProgram, CatalogPicks, NewProgramSheet, SourceUpdate |
| TemplatesPage | `program-templates/` | CatalogShowcase |
| MyProgramsPage | `programs-mine/` | — |
| TemplatePage | `program-template/` | — |
| SharedProgramPage | `program-shared/` | — |
| ProgramEditorPage | `program-editor/` | ProgramNameForm, PublishBlock |
| ComplexPage | `program-complex/` | — |
| AddExercisePage | `program-add-exercise/` | — |

Общие компоненты → наверх:
| Компонент | Кто использует | Куда |
|---|---|---|
| MyPrograms | ProgramsPage, MyProgramsPage | `widgets/my-programs/` |
| ProgramDetails, TakeFooter | TemplatePage, SharedProgramPage | `widgets/program-details/` |
| TemplateCard, TemplateTile | CatalogShowcase (templates), CatalogPicks (programs) | `widgets/program-templates/` |
| PublishSheet, ShowOthers, TagChipsField | ActiveProgram, MyPrograms, PublishBlock (editor) | `features/publish-program/` |

### workout/ → 4 папки
| Страница | Папка | Компоненты |
|---|---|---|
| WorkoutPage | `workout/` | всё Focus*, ExerciseCard, SupersetScreen, SetEntrySheet, RoundEntrySheet, WorkoutActions, WorkoutLanes, SyncStatus, FinishPending, RestRays, TimeBumps, set-caption |
| ReplaceExercisePage | `workout-replace/` | — |
| AddWorkoutExercisePage | `workout-add/` | — |
| SummaryPage | `workout-summary/` | SummaryHero, SummaryStats, CooldownNudge |

### workout-edit/ → 2: `workout-edit/`, `workout-edit-add/`

### library/ → 3: `library/` (MineButton, MineTab, NewEntryLinks), `exercise/` (OverlaySheet), `stretch/`

### me/ → 2
- `me/` — MePage + AccountCard, DeveloperTicket, SectionTicket, ThanksLink
- `me-section/` — MeSectionPage + sections.tsx и все *Section, GenderField, TermFields, BodyWeightChart
- ThemeSection (MePage и sections) → `features/change-theme/`

### auth/ → 5: `login/`, `register/`, `verify-email/`, `forgot-password/`, `reset-password/`
- AuthLayout → `shared/layouts/layout-auth/LayoutAuth.tsx`
- schemas → `entities/session/model/schemas.ts`
- CodeField (verify-email, reset-password) → `features/` или `shared/ui/kit/CodeField.tsx` (импорт `CODE_LENGTH` из сущности)

---

## Шаг 2. Логику — в `model/`, фазы — в `components/`

### workout (главное для мобилки)
- `model/use-workout-flow.ts` — всё состояние `WorkoutView`: выбранное упражнение, отдых, разминка, круг, секундомер, штамп, `startSet`, `finishRound`, `onSaved`, `onFinish`, `onDiscard`, вычисление `superset`/`nextMode`/`planDone`. Возвращает данные и действия, без JSX.
- `components/WorkoutView.tsx` — раскладка: шапка, лента, футер, шиты.
- `components/WorkoutFocus.tsx` — выбор оверлея: разминка / круг / подход / отдых / живая плашка.
- `components/StartWorkout.tsx`, `components/ElapsedInline.tsx`, `components/EmptyWorkout.tsx`.
- `WorkoutPage.tsx` остаётся ~40 строк: запрос, редиректы, выбор между View и StartWorkout.

### cooldown
- `model/use-cooldown-flow.ts` — фазы, `next`/`prev`/`go`/`finish`, отметки старта/финиша, исключение растяжки.
- `components/CooldownEmpty.tsx`, `CooldownOverview.tsx`, `CooldownMore.tsx`, `CooldownStep.tsx`, `CooldownProgress.tsx`.

### Остальные крупные страницы
| Страница | Вынести |
|---|---|
| exercise | `ExerciseHero` (фото, имя, бейджи, видео, публикация), `ExerciseMuscles` (мышцы/суставы с ограничениями), `OwnVideoSection`, `ExerciseFooter` |
| stretch | `StretchHero`, `StretchFooter` (попробовать / таймер удержания по сторонам) |
| program-templates | фильтры/сортировка — `model/use-templates-filter.ts`, список — компонент |
| workout-replace | список аналогов и шит создания — компоненты |
| friend | шапка друга, список программ — компоненты |
| onboarding | `Wizard` → `components/`, шаги уже вынесены |
| stats-workout | шапка, протокол, футер с удалением — компоненты |

### Общий виджет
- `widgets/catalog-guide/CatalogGuide.tsx` — описание + шаги + типичные ошибки (одинаково в exercise, stretch, cooldown). Фото+подпись — `PhotoPair` + `ImageCredit` уже есть, оставить.

---

## Шаг 3. Подготовка entities к выносу

- `Gender` — тип в `entities/profile/model/gender.ts`, хук `use-palette` импортирует его оттуда (а не наоборот).
- `entities/program/lib.ts`: статусы публикации с иконками и ссылки → `widgets/…` или `features/publish-program/lib.ts`; в сущности оставить чистые функции.
- `entities/session`: токен и `ability` (casl, кабинет) — остаются в приложении, в пакет не идут.

---

## Вынос API в пакет — разбор

### Что переносится

| Слой | Файлов | Переносимость |
|---|---|---|
| `shared/api/generated` (orval) | весь | 100%: axios-функции и типы |
| `shared/api/model` (mutator, request, type, api-error) | ~8 | 90%: интерцепторы берут токен и авторизацию из мини-аппа — сделать настраиваемыми |
| `entities/*` | ~60 | ~95%: зависят только от react-query, zod, `@/shared/api` и чистых `shared/lib` (`measure`, `superset`, `format`, `plural-forms`). Исключения — пункты шага 3 |
| `shared/lib` чистые функции | ~8 | 100% |
| `query-client.ts` | 1 | Нет: тосты, хаптика, хранилище — у каждого приложения своё |

### Как устроить пакет

```
packages/api/                    @sportbot/api
  src/
    client/   configure.ts       configureApi({ baseURL, getAuthorization, onUnauthorized, storage })
              request.ts         $api, request, customInstance (мутатор orval)
              http.ts            get / post / upload(file: Blob | { uri, name, type })
    generated/                   orval пишет сюда (один конфиг на оба приложения)
    entities/<name>/             хуки, ключи, схемы — как сейчас
    lib/                         measure, superset, format, plural-forms, weekdays
  package.json                   exports: "./*" → "./src/*" (без сборки, как render-contract)
                                 peerDependencies: react, @tanstack/react-query, axios, zod
```

Приложение при старте:
```ts
configureApi({
  baseURL: env.API_URL,
  getAuthorization: () => token ? `Bearer ${token}` : getMiniappAuthorization(), // мобилка — только Bearer
  onUnauthorized: clearAccessToken,
  storage: local, // веб — localStorage, мобилка — MMKV (синхронный интерфейс get/set/remove)
})
```

Импорты: `@/entities/workout` → `@sportbot/api/entities/workout` (механическая замена sed’ом, ~200 файлов).

### Насколько удобно

Плюсы:
- Одна правка запроса/хука — работает в обоих приложениях. Офлайн-очередь тренировки (`entities/workout/model/queue.ts`) — самая хрупкая логика — живёт в одном месте.
- `api:generate` один раз на оба клиента.
- Пакет без сборки: Vite и Metro компилируют TS из `src` напрямую, как уже сделано с `@sportbot/render-contract`.

Минусы и риски:
- Один `@tanstack/react-query` на монорепо: версии в обоих приложениях должны совпадать, иначе два QueryClient-контекста и «No QueryClient set».
- Сначала решить конфликт React (веб `^19.2.8`, мобилка `19.3.0`) — иначе две копии React.
- `@front-cmdt/utils` (`errorCatch`, `pluralize`, `log`) — проверить, что работает в RN.
- Правила `CLAUDE.md` («хуки в `src/entities/<entity>`») надо будет обновить на новый путь.

Оценка: ~1 день после рефакторинга страниц. Порядок: **шаги 1–3 → пакет → старт мобилки**. Делать пакет до рефакторинга страниц нет смысла: переносы страниц тронут те же импорты.

Чего в пакете не будет: хуков логики экранов (`pages/*/model`) — они завязаны на роутер (`useNavigate`) и копируются в мобилку руками. Если понадобится — можно сделать их независимыми от навигации (возвращают намерение «перейти к итогу», а не вызывают `navigate`), но это отдельное решение.

---

## Проверка после каждого шага
- `npx tsc -p tsconfig.app.json --noEmit` (не `tsc -p .`).
- Ручной прогон в браузере: тренировка от старта до итога, заминка, программы, библиотека.
- prettier не запускаю — форматирует пользователь.
