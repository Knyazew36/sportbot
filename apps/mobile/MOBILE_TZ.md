# ТЗ: мобильное приложение Спортбота на Expo

Цель — нативное приложение для iOS и Android с той же функциональностью, что у Mini App (`apps/frontend`, маршруты `miniappRoutes`), на том же API (`apps/server`). Кабинет организаций (`/app/:orgId/*`) в мобилку не переносим.

Исходная точка: `apps/mobile` — чистый шаблон Expo SDK 58 (RN 0.88, React 19.3, expo-router, typed routes, React Compiler).

## Статус (на 2026-10-25)

✅ сделано · ⚠️ частично · ❌ не начато

### Подготовка (раздел 0)
- ✅ 0.1–0.3 вложенный `.git` и `package-lock.json` удалены, пакет — `@sportbot/mobile`
- ✅ 0.4 React: фронт поднят до 19.3
- ✅ 0.5 metro — штатный `expo/metro-config`, `packages/*` резолвятся (бандл `expo export` собирается)
- ✅ 0.6 `check-types` в мобилке; ⚠️ `lint` через `expo lint`, в turbo отдельно не настраивали
- ✅ 0.7 демо шаблона удалено, ✅ 0.8 алиас `@/*`
- ⚠️ 0.9 `app.config.ts` с вариантами dev/preview/prod есть; `.env` и `eas.json` — нет

### Решения
- Общий код — вариант **B** сразу: пакет `@sportbot/api` (`generated`, `entities`, `client`, `lib`), мобилка подключает через `configureApi()`
- Стилизация: ✅ **Uniwind 1.13 (Tailwind v4) + React Native Reusables** — заведено на SDK 58 / RN 0.88, бандл собирается
  - `src/global.css` — источник цветов: имена токенов как во фронте (`bg-background`, `text-primary`, `border-border`, `px-gutter`, `bg-sb-blue`…), 4 темы Uniwind: `light`/`dark` (синяя) и `rose-light`/`rose-dark` (`extraThemes` в `metro.config.js`), `color-mix` посчитан заранее
  - тему ставит `ThemeProvider` (`Uniwind.setTheme` по палитре и системной схеме); цвета для SVG и нативных шторок — `useCSSVariable` из тех же переменных
  - из Reusables: `cn`, `TextClassContext` (цвет текста от контейнера), `Icon` (lucide через `withUniwind`), `Badge`, `Input`, `AlertDialog` (+ `PortalHost` в корне); `Button` — на их основе с вариантами и жёсткой тенью фронта
  - `src/uniwind-types.d.ts` генерирует Metro — файл коммитим, иначе `check-types` без Metro падает

### Этап 1
- ✅ Инфраструктура: axios-клиент, токен в SecureStore, query-client (`focusManager`/`onlineManager`, персист в MMKV, `buster` по пользователю, тосты `sonner-native`, хаптика), тема и обе палитры, шрифты
- ✅ Вход: email (вход, регистрация, код, восстановление), через бота Telegram и MAX. ❌ VK — нужна регенерация orval
- ✅ Онбординг
- ⚠️ Нижнее меню: ✅ «Сегодня» — все состояния дня, неделя, очередь, шторки; ⚠️ Профиль — карта участника и билеты разделов как во фронте, «Оформление» (палитра и тема авто/светлая/тёмная), «Аккаунт» (выход, удаление); остальные разделы — заглушки; Программы, Библиотека, Статистика — заглушки (содержимое — этап 2)
- ✅ Удаление аккаунта (`auth/delete-account`) — на устройстве не проверено
- ✅ Тренировка целиком: `workout` (фокус, суперсеты, разминка, ввод подходов), замена и добавление упражнения, заминка, завершение, итог, правка прошедшей (`workout/[id]/edit`, `edit/add`)
  - ⚠️ на правку пока не ведёт ни один экран: вход — со страницы тренировки в статистике (`/stats/workouts/[id]`, этап 2)
  - ⚠️ в шторке «Новое упражнение» нет картинки: нужен `expo-image-picker` и загрузка через FormData; поле необязательное
- ✅ Офлайн-очередь подходов и таймеры отдыха, keep-awake, уведомление об окончании отдыха
- ✅ Блок справочника для этапа 2 уже есть: `widgets/catalog` (поиск, чипы мышц и инвентаря, карта тела, выдача страницами, создание своего), `widgets/program-editor/ExercisePicker`
- ✅ Карточка упражнения `/library/exercises/[exerciseId]`: фото, мышцы и суставы с ⚠️ ограничений, техника, видео, «В тренировку», «Предложить правку», «Опубликовать». Входы: шторка «Сегодня», «Техника» на тренировке (`from=workout` прячет «В тренировку»). плашки для своего видео нет — видеоредактор в мобилку не ставим; ⚠️ в правке нет смены фото (expo-image-picker)

### Кит (`shared/ui/kit`)
✅ Всё на className (Uniwind): Typography, Icon, Button, ButtonLink, Screen/StickyFooter, ScreenHeader/TopBar, ScreenSection, QueryState/StateView, ListRow, StatGrid, ExerciseBlocks, InkPanel, Notice, Ticket, Badge, PersonAvatar, Image, CatalogImage/PhotoPair, StepList/MistakeList, OptionButton, Segmented, StepBar, Input, TextField, CodeField, ErrorText, Sheet (`@gorhom/bottom-sheet`), AlertDialog + ConfirmAction, Patterns (дорожки, штриховка, растр), Art (сгенерирован из фронта, без CSS-анимаций), Rise, SearchField, LoadMore, Grid (замена CSS grid), BodyMap (полигоны react-body-highlighter на react-native-svg)

### Не проверено
- Запуск на iOS/Android (dev-сборка) — пока только tsc и сборка бандла
- Таблица подходов `widgets/workout/SetList.tsx` на классах `grid grid-cols-[...]`: CSS grid в RN нет, колонки могут съехать — переделать на ряды или `Grid`
- Тап по карте тела (`BodyMap`) и возврат «назад» после замены/добавления упражнения

---

> Expo меняет API каждый SDK. Перед кодом с Expo/RN API сверяться с `https://docs.expo.dev/versions/v58.0.0/` (см. `apps/mobile/AGENTS.md`). Пакеты ставить только `npx expo install <pkg>` — он подбирает версии под SDK.

---

## 0. Подготовка репозитория (до первой строки кода)

| # | Что | Зачем |
|---|-----|-------|
| 0.1 | Удалить вложенный `apps/mobile/.git` | Иначе git корня видит папку как чужой репозиторий, файлы мобилки не попадут в коммиты |
| 0.2 | Удалить корневой `package-lock.json` | Менеджер — yarn 1 (`packageManager`), lock от npm конфликтует с `yarn.lock` |
| 0.3 | Переименовать пакет: `"name": "@sportbot/mobile"` | Единый неймспейс с `@sportbot/video`, `@sportbot/render-contract` |
| 0.4 | Решить конфликт версий React | Фронт на `react ^19.2.8`, мобилка — `19.3.0`. В yarn 1 workspaces с hoisting в одном бандле окажутся две копии React → «Invalid hook call». Варианты: поднять фронт до 19.3.x (проще) или `nohoist` для `react`, `react-dom`, `react-native*` в мобилке |
| 0.5 | `metro.config.js` для монорепо | `expo/metro-config` с SDK 52+ сам видит workspaces; проверить `watchFolders` на `packages/*`, если мобилка будет импортировать общие пакеты |
| 0.6 | turbo: таски `check-types`, `lint` у мобилки | `"check-types": "tsc --noEmit"`; `dev` мобилки не запускать из `turbo run dev` (Metro интерактивный) |
| 0.7 | Удалить демо шаблона | `npm run reset-project` или руками: `explore.tsx`, `components/*` шаблона, `assets/images/*` шаблона |
| 0.8 | tsconfig: алиас `@/*` → `src/*` | Тот же стиль импортов, что во фронте |
| 0.9 | `.env` и `app.config.ts` вместо `app.json` | Разные `EXPO_PUBLIC_API_URL`, bundle id и имя для dev / preview / prod |

---

## 1. Объём и этапы

### Этап 1 — MVP (без него в сторы не выходим)
- Вход: email (вход, регистрация, подтверждение кода, восстановление пароля) и через бота (Telegram, MAX, VK).
- Онбординг (`/onboarding`).
- Нижнее меню: Сегодня, Программы, Библиотека, Статистика, Профиль.
- Тренировка целиком: `workout`, замена/добавление упражнения, заминка, завершение, итог, редактирование прошедшей.
- Офлайн-очередь подходов и таймеры отдыха (как во фронте).
- Удаление аккаунта (обязательно для App Store, эндпоинт `auth/delete-account` есть).

### Этап 2
- Программы: шаблоны, свои, редактор, комплексы, добавление упражнений, расшаренные по ссылке.
- Статистика: упражнения, рекорды, день, тренировка.
- Друзья, приглашения, «Поделиться» тренировкой/программой.
- Push-уведомления (нужен бэкенд, см. раздел 11).
- Deep links / universal links.

### Этап 3 (по решению)
- Редактор роликов (`/me/editor*`, рендер видео, плашка на карточке упражнения) — в мобилку не ставим, только Mini App (решение 2026-10-25).
- Админка (`/admin/*`) — оставить в вебе.
- Developer-экран.
- Донаты звёздами — см. раздел 9 (ограничения сторов).

### Карта маршрутов

expo-router: файлы в `src/app` — только тонкие роуты, которые рендерят страницу из `src/pages`.

| Mini App (`ROUTES`) | Expo Router файл |
|---|---|
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | `src/app/(auth)/login.tsx` … |
| `/onboarding` | `src/app/(app)/onboarding.tsx` |
| `/today` | `src/app/(app)/(tabs)/index.tsx` |
| `/programs` | `src/app/(app)/(tabs)/programs/index.tsx` |
| `/programs/templates`, `/programs/mine`, `/programs/templates/[templateId]`, `/programs/shared/[token]`, `/programs/[programId]`, `…/complex/[complexId]`, `…/add/[complexId]` | `src/app/(app)/(tabs)/programs/…` (стек внутри таба) |
| `/library`, `/library/exercises/[exerciseId]`, `/library/stretches/[stretchId]` | `src/app/(app)/(tabs)/library/…` |
| `/stats`, `/stats/exercises`, `/stats/exercises/[exerciseId]`, `/stats/records`, `/stats/workouts/[workoutId]`, `/stats/days/[date]` | `src/app/(app)/(tabs)/stats/…` |
| `/me`, `/me/[section]`, `/me/support` | `src/app/(app)/(tabs)/me/…` |
| `/friends/[friendId]` | `src/app/(app)/friends/[friendId].tsx` |
| `/workout`, `/workout/replace/[itemId]`, `/workout/add` | `src/app/(app)/workout/…` — полноэкранный стек поверх табов (`presentation: 'fullScreenModal'`) |
| `/workout/[workoutId]/summary`, `/finished`, `/edit`, `/edit/add`, `/cooldown` | `src/app/(app)/workout/[workoutId]/…` |
| `/result/[token]` | `src/app/result/[token].tsx` (публичный, открывается по ссылке) |

Гварды (`GuestRoute`, `PrivateRoute`, `MiniappRoute`) → `Stack.Protected guard={…}` в `_layout.tsx` групп `(auth)` / `(app)`; редирект на онбординг — в `(app)/_layout.tsx` по профилю.

---

## 2. Архитектура

Та же FSD-структура, что во фронте, чтобы код и правила `CLAUDE.md` переносились один в один:

```
apps/mobile/src/
  app/            ← только роуты expo-router и _layout (без логики)
  pages/<page>/   ← экран + components/ (блоки только этой страницы)
  widgets/
  features/
  entities/<entity>/  ← query-хуки, ключи, model/schemas.ts
  shared/
    api/          ← $api, mutator, query-client, generated/
    auth/         ← токен, события сессии
    config/       ← env, routes
    lib/          ← storage, haptics, format, hooks
    theme/        ← токены, палитры, шрифты
    ui/kit/       ← компоненты (порт shared/ui/kit)
    layouts/      ← Layout<Name> по правилам проекта
```

Правила проекта (`CLAUDE.md`: запросы, тосты через `meta`, формы на react-hook-form + zod, схемы в `entities/*/model/schemas.ts`) действуют без изменений.

### Общий код с фронтом — решение нужно принять

| Вариант | Плюсы | Минусы |
|---|---|---|
| **A. Копия** — свой orval-конфиг в мобилке, хуки сущностей копируются | Старт за день, фронт не трогаем | ~25 сущностей дублируются, правки в двух местах |
| **B. Пакет `@sportbot/api`** — `generated/` + `entities/*` (хуки и ключи) + zod-схемы + `lib/format`, `plural-forms`, `measure`, `weekdays`; приложение передаёт свой axios-инстанс через `configureApi()` | Одна правка — оба клиента; хуки сущностей уже не зависят от DOM | Рефакторинг импортов фронта, нужен один `react-query` на монорепо |

Рекомендация: **B**, но после этапа 1. На этапе 1 — вариант A для `generated/` и только нужных сущностей, затем вынос в пакет. Хуки во фронте зависят только от сгенерированных функций и `meta`, поэтому переносятся без изменений; `query-client.ts` (тосты, хаптика, хранилище) остаётся своим у каждого приложения.

---

## 3. API-слой

Перенести из `apps/frontend/src/shared/api` почти без изменений:

- `request.ts` — axios с `timeout: 15_000`, интерцепторы. Изменения:
  - `Authorization` — только `Bearer <token>`; ветки `getMiniappAuthorization()` нет.
  - `ORGANIZATION_HEADER` не нужен (кабинета нет).
  - Лог через `@front-cmdt/utils/log` проверить в RN; если тянет DOM — заменить на `console` в dev.
- `orval-mutator.ts` — без изменений (`UnwrapData`, `customInstance`).
- `customInstanceBlob` — в RN `responseType: 'blob'` ненадёжен. Бинарные ручки качать через `expo-file-system` (`File.downloadFileAsync` / `downloadAsync`, сверить API SDK 58) с заголовком авторизации.
- `http.upload` — в RN `FormData.append('file', { uri, name, type })`, а не `File`.
- `orval.config.ts` мобилки: тот же `input` (`${API_URL}/docs-json`), `client: 'axios-functions'`, мутатор из мобилки. Генерацию запускает пользователь с живого сервера (как для фронта).
- `baseURL` — из `EXPO_PUBLIC_API_URL`. В dev на телефоне `localhost` не работает: IP машины в сети или туннель.
- CSRF: проверить, нужен ли он для Bearer-запросов. Если сервер требует CSRF-cookie — для мобилки отключить (Bearer не уязвим к CSRF) — **задача бэкенда**.

### Хранение токена
- Токен — `expo-secure-store` (Keychain / Keystore), не AsyncStorage.
- `remember=false` (sessionStorage) в мобилке не нужен: токен живёт до выхода.
- События сессии (`emitSessionChange`/`subscribeSession`) переносятся как есть; при пропаже токена — `queryClient.clear()` и очистка персиста.

---

## 4. Авторизация

### Email — эндпоинты уже есть
`auth/register`, `auth/login`, `auth/verify-email`, `auth/resend-verification`, `auth/forgot-password`, `auth/reset-password`, `auth/change-password`, `auth/delete-account`. Экраны и схемы переносятся из `pages/auth` (react-hook-form + zod, `InputOTP` → нативный OTP-инпут, см. пакеты).

### Вход через бота — эндпоинты уже есть
`POST auth/telegram-login/start` → ссылка на бота + `token`; `GET auth/telegram-login/status?token=` → `pending | confirmed | rejected | expired`, при `confirmed` — `accessToken`, `isNewUser`, `user`. То же для `max-login` и `vk-login`.

Поток в приложении:
1. `start` → открыть ссылку через `Linking.openURL` (откроет приложение мессенджера).
2. Опрашивать `status` каждые 2 с, пока экран активен (`refetchInterval` + пауза по `AppState`); при возврате в приложение — сразу запрос.
3. `confirmed` → сохранить токен; `isNewUser` → онбординг.

Задача на бэк (желательно): после подтверждения бот показывает кнопку «Вернуться в приложение» с deep link `sportbot://auth/done`, чтобы не переключаться руками.

### Срок жизни сессии — задача бэкенда
JWT живёт `JWT_EXPIRES_IN=7d`, refresh-токена нет. Для мобилки это выход из аккаунта раз в неделю. Варианты: refresh-токены (`auth/refresh`) или отдельный TTL для мобильного клиента (например, 90 дней). На 401 клиент сбрасывает токен и уводит на вход — как во фронте.

### App Store: Sign in with Apple
Гайдлайн 4.8: если есть вход через сторонние сервисы (Telegram, VK), нужно предложить вариант с защитой приватности — фактически Sign in with Apple. Нужны `expo-apple-authentication` и эндпоинт `auth/apple` на сервере (проверка identityToken, поле `appleId` в `User`). Без этого высок риск отказа на ревью.

---

## 5. Запросы, кэш, офлайн

Перенести `query-client.ts` с теми же договорённостями `meta` (`successMessage`, `skipSuccessToast`, `inlineFieldErrors`, `persist`). Замены:

| Веб | Мобилка |
|---|---|
| `refetchOnWindowFocus` | `focusManager.setEventListener` на `AppState` (`active`) |
| `onlineManager` по событиям браузера | `onlineManager.setEventListener` на `expo-network` (или `@react-native-community/netinfo`) |
| `createSyncStoragePersister` + localStorage | `createAsyncStoragePersister` (`@tanstack/query-async-storage-persister`) поверх MMKV или AsyncStorage |
| `buster: getMiniappUserKey()` | `buster: \`user:${userId}\`` |
| `toast` (shadcn) | нативный тост (см. пакеты) |
| `haptic.*` (WebApp) | `expo-haptics` |

`resumePersistedMutations` и офлайн-очередь подходов работают так же: после `PersistQueryClientProvider` `onSuccess` — `resumePausedMutations()`. Проверить сценарий: «зал без сети → записал 5 подходов → убил приложение → открыл с сетью → всё доехало».

---

## 6. Замены возможностей Mini App

Весь `shared/miniapp` во фронте — мост к мессенджеру. В мобилке его нет, каждая функция заменяется:

| Mini App (`WebApp`) | Мобилка |
|---|---|
| `BackButton` | Шапка native stack + системный жест / Android back (`BackHandler` там, где нужно подтверждение) |
| `HapticFeedback` | `expo-haptics` |
| `colorScheme`, `setHeaderColor`, `setBottomBarColor` | `useColorScheme`, `expo-system-ui`, `expo-status-bar`, `expo-navigation-bar` |
| `--tg-safe-area-*` | `react-native-safe-area-context` |
| `requestFullscreen`, `disableVerticalSwipes` | Не нужно |
| `openLink`, `openTelegramLink` | `expo-web-browser` (in-app браузер) / `Linking.openURL` |
| `shareContent`, `t.me/share` | `Share` из RN (текст + ссылка), картинка карточки — `expo-sharing` |
| `downloadFile` (ролики) | `expo-file-system` → `expo-media-library` (в галерею) или `expo-sharing` |
| `requestWriteAccess` (бот может писать) | Разрешение на push (`expo-notifications`) |
| `openInvoice` (звёзды) | См. раздел 9 |
| `start_param` / `?startapp=` | Deep links (раздел 10) |
| `localStorage` (таймеры, флаги) | MMKV (синхронный — `use-deadline-timer` переносится почти без изменений) |
| `initData` авторизация | Bearer JWT |

---

## 7. Тренировка — особые требования

- **Экран не гаснет** во время тренировки: `expo-keep-awake` (`useKeepAwake` на экранах `workout/*`).
- **Таймер отдыха в фоне**: отсчёт по `endsAt` уже устроен правильно (`use-deadline-timer`). Добавить локальное уведомление на `endsAt` (`expo-notifications`, `scheduleNotificationAsync` с триггером по дате), отменять при паузе/сбросе/открытии приложения. Звук + вибрация.
- **Живая плашка тренировки** (`LiveWorkoutBar`) — виджет над табами; опционально (этап 3) iOS Live Activity / Android ongoing notification — отдельная оценка, нужен нативный модуль.
- **Свёрнутое приложение** не теряет состояние: таймеры и очередь в MMKV/персисте.
- Хаптика на подходе, завершении, ошибке — как во фронте (`haptic.success/error`).
- Шиты ввода подхода (`SetEntrySheet`, `RoundEntrySheet`) — bottom sheet с клавиатурой: проверить, что инпут не перекрыт (`react-native-keyboard-controller`).

---

## 8. Дизайн и UI-кит

### Токены
Источник — `apps/frontend/src/global.css` (`--sb-*`) и `packages/brand/tokens.json`. Перенести в `src/shared/theme/tokens.ts`:
- палитры: стандартная светлая/тёмная, розовая светлая/тёмная (`--sb-paper`, `--sb-sheet`, `--sb-ink`, `--sb-blue`, `--sb-rule`, `--sb-danger`, `--sb-positive`, `--sb-gold`, `--sb-live*`, `--sb-rest*`);
- `color-mix(...)` посчитать заранее в hex/rgba — в RN его нет;
- выбранная палитра и тема — в MMKV.

### Шрифты
Onest (основной), Oswald (display), JetBrains Mono, Cormorant (serif). Через `expo-font` (плагин в `app.config`) + пакеты `@expo-google-fonts/*`. Variable-шрифты в RN поддерживаются плохо — брать статические начертания нужных весов.

### Стилизация и кит — решение принято
**React Native Reusables + Uniwind.** Запасной вариант — Reusables + NativeWind, если Uniwind не заведётся на SDK 58.

- **React Native Reusables** (reactnativereusables.com) — порт shadcn/ui для RN: те же компоненты и API (`variant`, `size`, `cva`), CLI копирует исходник в проект, как shadcn. Под капотом `@rn-primitives/*` — порт Radix.
- **Uniwind** — Tailwind v4 для RN: классы почти совпадают с вебом, разметку кита переносим правкой классов.
- Почему: веб уже на shadcn + Tailwind, поэтому кит (`shared/ui`) переносится с теми же именами, пропсами и вариантами, а не пишется с нуля.

Первая задача подготовки — проверка связки на SDK 58 / RN 0.88: поставить Uniwind и Reusables, собрать dev-сборку с одним `Button` на iOS и Android. Не собралось на Uniwind — переходим на NativeWind, остальное без изменений.

Что в RN не переносится из CSS и переписывается: `color-mix(...)` (считаем в токенах заранее), сложные селекторы и `:has`, анимации через классы (→ Reanimated), `@media (max-height)` (→ `useWindowDimensions`).

### Компоненты
Компоненты shadcn берём из Reusables; чего там нет (animate-ui, шторки, тосты) — отдельными библиотеками из таблицы ниже. Имена и API компонентов кита сохраняем (`Typography` → `Poster/Lead/Eyebrow/Text`, `Screen`, `ScreenHeader`, `ListRow`, `Segmented`, `StatGrid`, `Ring`, `Sparkline`, `StepChart`, `BodyMap`, `TimerButton`, `UndoBar`, `QueryState`/`QueryScreen` и т.д.). Правила из памяти проекта действуют: кнопки с жёсткой тенью (не пилюли), тексты — компонентами типографики, бейджи только для тегов, экраны только из `shared/ui`.

| Веб | Мобилка |
|---|---|
| Sheet / Drawer | `@gorhom/bottom-sheet` (или `BottomSheet` из `@expo/ui`, уже установлен — сравнить) |
| Toast (shadcn) | `sonner-native` |
| `motion` | `react-native-reanimated` (уже есть) |
| `embla-carousel` | `react-native-reanimated-carousel` или `FlatList` с `pagingEnabled` |
| `recharts` | `victory-native` (+ `@shopify/react-native-skia`) или `react-native-gifted-charts` |
| `react-body-highlighter` | `react-native-body-highlighter` |
| `lucide-react` | `lucide-react-native` (+ `react-native-svg`) или `expo-symbols` на iOS |
| `input-otp` | `input-otp-native` |
| `react-day-picker` | `@react-native-community/datetimepicker` или свой календарь |
| длинные списки | `@shopify/flash-list` или `FlatList` |

---

## 9. Донаты звёздами

Единственное назначение платежа — `donation` (Telegram Stars). В нативном приложении:
- iOS: цифровые «чаевые» разработчику без IAP App Store не пропустит. Решение: **скрыть экран** на iOS (или IAP — отдельная задача, нужен `react-native-iap` / RevenueCat + серверная проверка чеков).
- Android: Google Play тоже требует свою оплату для цифровых товаров. Тоже скрыть.

Итого: в мобилке экрана доната нет. `canPayStars()` → `false`.

---

## 10. Deep links

- Схема: `scheme: "sportbot"` (сейчас `mobile`).
- Universal links (iOS, `associatedDomains`) и App Links (Android, `intentFilters`) на прод-домен для путей: `/programs/shared/:token`, `/result/:token`, приглашения в друзья, вход через бота (`/auth/done`).
- Сервер должен отдавать `/.well-known/apple-app-site-association` и `/.well-known/assetlinks.json` — **задача бэкенда / nginx**.
- Кнопки бота сейчас ведут в Mini App через `startapp`; для пользователей с приложением можно вести на universal link — решение позже.

---

## 11. Push-уведомления — нужен бэкенд

Сейчас напоминания и опросы шлёт бот в мессенджер (`plan-cron.service`, `poll.service`, выбор канала — `link/notify`). Для приложения:

Клиент:
- `expo-notifications` + `expo-device`: запрос разрешения (после онбординга, не на старте), получение Expo push token, отправка на сервер, обработка тапа → переход на экран.
- Android: каналы уведомлений («Напоминания», «Таймер отдыха»).

Сервер (новое):
- Модель `PushToken { userId, token, platform, createdAt, lastSeenAt }`, эндпоинты `POST push-token/create`, `POST push-token/delete` (по правилам проекта — полный CRUD).
- Отправка через Expo Push API (`expo-server-sdk`), обработка receipts, удаление невалидных токенов.
- Новый канал в `link/notify`: «в приложение».
- Credentials: APNs key и FCM (google-services.json) — через EAS.

---

## 12. Медиа

- Картинки каталога (`CatalogImage`, `Art`, `PhotoGallery`) — `expo-image` (кэш на диск, плейсхолдеры).
- Видео упражнений, если есть — `expo-video`.
- Загрузка файлов (аватар, фото) — `expo-image-picker`; документы — `expo-document-picker`.
- Сохранение ролика — `expo-media-library` (разрешение на запись в галерею).

---

## 13. Пакеты

Ставить: `npx expo install <пакеты>` из `apps/mobile`.

### Уже стоят (шаблон)
`expo-router`, `expo-image`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui`, `expo-linking`, `expo-web-browser`, `expo-constants`, `expo-device`, `expo-symbols`, `expo-glass-effect`, `@expo/ui`, `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`.

### Этап 1 — обязательные
| Пакет | Зачем |
|---|---|
| `@tanstack/react-query` | Запросы (та же версия, что во фронте) |
| `@tanstack/react-query-persist-client`, `@tanstack/query-async-storage-persister` | Персист кэша и офлайн-очереди |
| `axios` | HTTP + orval-мутатор |
| `zod`, `react-hook-form`, `@hookform/resolvers` | Формы, как во фронте |
| `date-fns` | Даты (переносим `format.ts`) |
| `@front-cmdt/utils` | `errorCatch`; проверить, что работает в RN |
| `expo-secure-store` | Токен |
| `react-native-mmkv` (+ `react-native-nitro-modules`) | Быстрое синхронное хранилище: таймеры, флаги, кэш |
| `expo-network` | Онлайн/офлайн для `onlineManager` |
| `expo-haptics` | Вибрация |
| `expo-keep-awake` | Экран не гаснет на тренировке |
| `expo-notifications` | Локальное уведомление «отдых закончился» (этап 1), push (этап 2) |
| `expo-navigation-bar` | Цвет системной панели Android |
| `react-native-svg` | Иконки, кольца, спарклайны |
| `lucide-react-native` | Иконки, как во фронте |
| `@gorhom/bottom-sheet` | Шиты (ввод подхода, выбор) |
| `react-native-keyboard-controller` | Инпуты в шитах не уходят под клавиатуру |
| `sonner-native` | Тосты |
| `input-otp-native` | Код из письма |
| `@expo-google-fonts/onest`, `@expo-google-fonts/oswald`, `@expo-google-fonts/jetbrains-mono`, `@expo-google-fonts/cormorant` | Шрифты |
| `expo-apple-authentication` | Sign in with Apple (если вход через Telegram/VK остаётся) |
| `expo-dev-client` | Dev-сборка: MMKV, bottom-sheet и др. не работают в Expo Go |
| `expo-updates` | OTA-обновления через EAS Update |
| `uniwind` (запасной — `nativewind`) | Tailwind-классы в RN |
| `@rn-primitives/*` | Примитивы под компоненты Reusables (ставит CLI Reusables вместе с компонентом) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | `cva`/`cn` — как во фронте |

### Этап 2
| Пакет | Зачем |
|---|---|
| `expo-sharing` | «Поделиться» карточкой-картинкой |
| `expo-file-system` | Скачивание файлов/роликов |
| `expo-media-library` | Сохранение в галерею |
| `expo-image-picker` | Аватар, фото |
| `expo-clipboard` | Копирование ссылок-приглашений |
| `victory-native` + `@shopify/react-native-skia` (или `react-native-gifted-charts`) | Графики статистики |
| `react-native-body-highlighter` | Карта мышц |
| `@shopify/flash-list` | Длинные списки (каталог, история) |
| `@react-native-community/datetimepicker` | Выбор даты |
| `react-native-reanimated-carousel` | Карусели |
| `expo-localization` | Локаль/часовой пояс для дат и напоминаний |

### Dev и качество
| Пакет | Зачем |
|---|---|
| `orval` (dev) | Генерация API |
| `eslint-config-expo` | `expo lint` |
| `@sentry/react-native` | Краш-репорты с прода (вместо логов в консоли браузера) |

### Не нужны
`@base-ui/react`, `radix-ui`, `@floating-ui/react`, `next-themes`, `motion`, `embla-carousel-react`, `react-day-picker`, `recharts`, `@fontsource-variable/*`, `@casl/ability` (права кабинета), `react-router`, `react-native-web` / `react-dom` (если веб-сборка мобилки не нужна — веб уже есть у фронта).

---

## 14. Конфигурация приложения (`app.config.ts`)

- `name: "Спортбот"`, `slug: "sportbot"`, `scheme: "sportbot"`, `orientation: "portrait"`, `userInterfaceStyle: "automatic"`.
- `ios.bundleIdentifier`, `android.package` (например `ru.sportbot.app`), суффиксы `.dev` / `.preview` для разных профилей.
- Иконка, adaptive icon, splash — из `packages/brand` (заменить ассеты шаблона, цвет splash — `--sb-paper`, не `#208AEF`).
- `ios.infoPlist`: тексты разрешений на русском (`NSPhotoLibraryUsageDescription`, `NSPhotoLibraryAddUsageDescription`, `NSCameraUsageDescription`), `ITSAppUsesNonExemptEncryption: false`.
- `ios.associatedDomains`, `android.intentFilters` — для universal links.
- Плагины: `expo-router`, `expo-splash-screen`, `expo-font`, `expo-secure-store`, `expo-notifications`, `expo-apple-authentication`, `expo-media-library`, `expo-image-picker`, `@sentry/react-native`, `expo-build-properties` (если понадобятся нативные флаги).
- `web.output: "server"` убрать, если веб-сборка не нужна.
- `experiments.typedRoutes`, `reactCompiler` — оставить.

## 15. Сборка и выпуск (EAS)

- `eas.json`: профили `development` (dev client, internal), `preview` (internal, APK/ad-hoc для тестировщиков), `production` (store).
- EAS Update: каналы `preview` / `production`, `runtimeVersion: { policy: "appVersion" }` — OTA только для JS-правок.
- Секреты (`EXPO_PUBLIC_API_URL`, Sentry DSN) — EAS env по окружениям.
- Аккаунты: Apple Developer, Google Play Console; политика конфиденциальности (URL) и анкеты данных (App Privacy / Data safety) — обязательны.
- CI (опционально): `eas build` по тегу.

---

## 16. Задачи для бэкенда (сводка)

| # | Задача | Этап |
|---|---|---|
| B1 | Долгая сессия: refresh-токены или длинный TTL для мобилки | 1 |
| B2 | Sign in with Apple: `auth/apple`, поле `appleId` в `User` | 1 (до ревью iOS) |
| B3 | Проверить CSRF для Bearer-запросов без cookie | 1 |
| B4 | Кнопка «Вернуться в приложение» после входа через бота (deep link) | 1 |
| B5 | Push: модель `PushToken`, CRUD, отправка через Expo Push API, канал «в приложение» в `link/notify` | 2 |
| B6 | `apple-app-site-association`, `assetlinks.json` на домене (nginx) | 2 |
| B7 | Ссылки бота/шаринга, ведущие в приложение, если оно установлено | 2 |

---

## 17. Критерии приёмки этапа 1

- Вход по email и через Telegram/MAX/VK; сессия переживает перезапуск; 401 → экран входа.
- Новый пользователь проходит онбординг, существующий попадает на «Сегодня».
- Тренировка от старта до итога без сети: подходы сохраняются, после появления сети доезжают; убийство приложения ничего не теряет.
- Таймер отдыха корректен после сворачивания; при выключенном экране приходит уведомление.
- Экран не гаснет во время тренировки.
- Тосты успеха/ошибки и ошибки полей работают по правилам `meta`.
- Светлая/тёмная тема и обе палитры совпадают с Mini App.
- Проверено на iOS и Android, ширина от 375 pt, вырезы и жестовая навигация.
- `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` — без ошибок.

## 18. Открытые вопросы

1. ~~Общий код~~ — решено: вариант B, пакет `@sportbot/api` (см. «Статус»).
2. ~~Стилизация~~ — решено: React Native Reusables + Uniwind (запасной NativeWind), см. раздел 8.
3. Вход через Telegram/VK в iOS-версии: оставить (тогда обязателен Sign in with Apple) или только email + Apple.
4. Админка — в мобилке или только в вебе. Редактор роликов решён: только веб.
5. Нужна ли веб-сборка мобилки (`react-native-web`) — скорее нет.
6. Bundle id, название в сторах, аккаунты разработчика.
