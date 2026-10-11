# Модуль Telegram (`src/messengers/telegram`)

Всё, что связано с Telegram, в одном Nest-модуле. Устроен так же, как `src/messengers/max` (подробный README там). Ниже — только то, что у Telegram отличается.

| Возможность                       | Как работает                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Авторизация в мини-приложении** | Фронт шлёт подписанный `initData`, `TelegramAuthStrategy` проверяет подпись токеном бота                                 |
| **Вход в веб-версию через бота**  | QR со ссылкой `https://t.me/<bot>?start=login_<token>` → чат с ботом → кнопка «Подтвердить вход» → браузер забирает JWT  |
| **Привязка Telegram к аккаунту**  | Ссылка `?start=link_<token>` → бот спрашивает «Привязать к аккаунту user@mail?» → кнопка «Привязать»                     |
| **Уведомления через бота**        | `TelegramBotService.sendMessage` + проверка `TelegramDialogService.canDeliver(user)`                                     |
| **Учёт, открыт ли чат**           | Telegram не даёт боту писать первым. Модуль отмечает `/start`, блокировку/разблокировку (`my_chat_member`) в `User.data` |

Проектная логика — в адаптере `src/messengers/adapters/app-telegram.adapter.ts` (`extends TelegramAppAdapter`, те же методы, что у MAX).

---

## Как бот получает события

**Long polling** через `telegraf` / `nestjs-telegraf` (`bot/telegram-bot.service.ts`). Входящего вебхука нет, Telegram к нам запросов не делает.

- `nestjs-telegraf` зарегистрирован с `launchOptions: false`, polling запускает модуль сам. Причина: штатный запуск не ловит ошибку старта, и неверный токен или отсутствие сети молча убивают polling навсегда. Здесь сбой логируется и повторяется с паузой 5 с, 10 с, … до 60 с, сервер не падает.
- При старте `telegraf` вызывает `deleteWebhook`. Если на этот токен был настроен вебхук, он снимется.

---

## Подключение

### 1. Бот в @BotFather

1. `/newbot` → токен (`TG_BOT_TOKEN`) и имя бота (`TG_BOT_NAME`, без `@`).
2. Мини-приложение (необязательно): `/mybots` → бот → **Bot Settings → Configure Mini App** → URL фронта (только `https`). Тогда ссылка `https://t.me/<bot>?startapp` откроет его.
3. Кнопка меню (необязательно): **Bot Settings → Menu Button** → тот же URL.

Включать ничего, кроме этого, не нужно: `/start`, сообщения, нажатия кнопок и `my_chat_member` приходят боту по умолчанию.

### 2. Переменные окружения

```env
TG_BOT_TOKEN="..."   # токен от @BotFather
TG_BOT_NAME="my_bot" # имя бота без @, из него собираются ссылки https://t.me/my_bot
```

`FRONTEND_URL` (общий для сервера) — адрес мини-приложения для кнопки «Открыть приложение». Telegram принимает в `web_app`-кнопке только `https`, поэтому на локальном `http://localhost` кнопка ведёт на `https://t.me/<bot>?startapp`.

Модуль подключается, только если заданы оба `TG_*` (`src/messengers/app-messengers.ts`). Иначе в логе `❌ Telegram выключен …`, и сервер стартует без Telegram.

> **Генерация API.** Без модуля эндпоинтов `telegram` нет в `/api/docs-json`, и `yarn api:generate` (orval с `clean: true`) удалит `generated/telegram`. Для генерации без настоящего бота хватит заглушек `TG_BOT_TOKEN=dummy`, `TG_BOT_NAME=dummy`: сервер не упадёт, polling будет писать в лог ошибку и повторять.

### 3. Проверка после запуска

В логе (фильтр по `✈️`):

| Строка                                                 | Значит                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------- |
| `✅ Telegram подключён: бот @<name>`                   | env заданы, модуль зарегистрирован                                         |
| `✅ Polling запущен, бот @<name>`                      | бот получает апдейты                                                       |
| `❌ Polling не запустился (попытка N), повтор через …` | неверный токен или нет сети                                                |
| ошибка `409 Conflict: terminated by other getUpdates`  | этот токен уже опрашивает другой процесс (второй инстанс, локальная копия) |

### 4. Схема Prisma

```prisma
model User {
  telegramId   String? @unique // id пользователя Telegram
  telegramData Json?           // профиль из initData (имя, username, фото)
  data         Json?           // служебные маркеры: telegramDialogStartedAt / telegramDialogClosedAt
}
```

### 5. Регистрация и guard

```ts
TelegramIntegrationModule.forRoot({
  token: process.env.TG_BOT_TOKEN!,
  botName: process.env.TG_BOT_NAME!,
  webAppUrl: 'https://app.example.com', // необязательно, только https
  adapter: AppTelegramAdapter,
  authGuard: MultiAuthGuard,
  imports: [AppMessengersSupportModule],
}),
```

Модуль глобальный, снаружи его сервисы инжектятся через `@Optional()`. `TelegramAuthStrategy` добавлена в `MultiAuthGuard` (`src/common/guards/multi-auth.guard.ts`). Фронт шлёт `Authorization: tma <initData>`.

---

## Отличия от MAX

- **Разрешение писать из мини-приложения.** Если пользователь дал боту право писать (`requestWriteAccess`), в `initData` приходит `allows_write_to_pm`. `TelegramAuthStrategy` сразу ставит маркер «чат открыт», чат с ботом открывать не нужно.
- **Блокировка бота** приходит событием `my_chat_member` (`kicked` → чат закрыт, `member` → снова открыт). При отправке ошибка 403 тоже помечает чат закрытым.
- **payload диплинка** — до 64 символов из `[A-Za-z0-9_-]`, иначе Telegram откроет чат без payload. **callback_data** кнопок — до 64 байт.
- **Один обработчик на апдейт.** Обработчики `nestjs-telegraf` не вызывают `next()`. Не вешайте свой `@On('callback_query')` / `@On('text')`: модуль или ваш код перестанет получать события. Свои кнопки и сообщения — через `TelegramAppAdapter.onCallback` / `onMessage`.

## HTTP API

| Метод  | Путь                                | Доступ      | Что делает                                                                                    |
| ------ | ----------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `POST` | `auth/telegram-login/start`         | публичный   | `{ token, url, expiresAt }` — ссылка на чат с ботом для QR                                    |
| `GET`  | `auth/telegram-login/status?token=` | публичный   | `pending` / `confirmed` (+ `accessToken`, `user`, отдаётся один раз) / `rejected` / `expired` |
| `POST` | `user/me/link-telegram/start`       | `authGuard` | `{ url, expiresAt }` — ссылка привязки к текущему аккаунту                                    |

Отвязка — `POST user/me/telegram/unlink` в модуле пользователей проекта. Подтверждения через HTTP **нет намеренно**: только кнопкой в чате.

## Совместимость payload

| Где           | Значение                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| диплинк       | `login_<token>`, `link_<token>`                                                                 |
| кнопки модуля | `tg_login:confirm:/reject:<token>`, `tg_link:confirm:/reject:<token>`, `tg:notifications:check` |

Менять только с поддержкой старого значения: кнопки живут в уже отправленных сообщениях.

## Ограничения

- **Один процесс на токен.** Два процесса с одним токеном конфликтуют на `getUpdates` (409). Для нескольких инстансов нужен вебхук.
- **Токены входа/привязки хранятся в памяти** (`deeplink/telegram-token-store.ts`). При нескольких инстансах нужен Redis/БД.

## Структура

```
telegram/
├── index.ts                         — публичный API (`@/messengers/telegram`)
├── telegram-integration.module.ts   — TelegramIntegrationModule.forRoot(options)
├── telegram-app.adapter.ts          — контракт с проектом (abstract class)
├── telegram.types.ts / telegram.constants.ts
├── auth/                            — проверка initData мини-приложения
├── bot/telegram-bot.service.ts      — запуск polling с ретраем, sendMessage, клавиатуры
├── bot/telegram-bot.update.ts       — /start, my_chat_member, кнопки входа/привязки
├── messenger/                       — Telegram как реализация общего контракта MessengerChannel
├── deeplink/                        — вход, привязка, хранилище токенов, сборка ссылок
├── dialog/                          — открыт ли чат (чистые функции + сервис над БД)
└── controller/, dto/, guards/       — HTTP-эндпоинты
```

## Фронт

`apps/frontend/src/features/telegram` (см. README там).
