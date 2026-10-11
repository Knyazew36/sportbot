# Модуль VK (`src/messengers/vk`)

Всё, что связано с [VK](https://dev.vk.com), в одном Nest-модуле. Устроен так же, как `src/messengers/max` и `src/messengers/telegram`.

| Возможность                       | Как работает                                                                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Авторизация в мини-приложении** | Фронт шлёт подписанные launch-параметры (`vk_*` из адреса), `VkAuthStrategy` проверяет подпись защищённым ключом приложения         |
| **Вход в веб-версию через VK**    | QR со ссылкой `https://vk.me/club<id>?ref=login_<token>` → чат с сообществом → кнопка «Подтвердить вход» → браузер забирает JWT     |
| **Привязка VK к веб-аккаунту**    | Ссылка `?ref=link_<token>` → бот спрашивает «Привязать к аккаунту user@mail?» → кнопка «Привязать»                                  |
| **Уведомления через бота**        | `VkBotService.sendMessage` + проверка `VkDialogService.canDeliver(user)`                                                            |
| **Учёт, разрешены ли сообщения**  | VK не даёт сообществу писать первым. Модуль сам отмечает разрешение и запрет в `User.data` (события `message_allow`/`message_deny`) |

Проектная логика (как выдаются сессии, как сливаются аккаунты, свои кнопки) — **не в модуле**, а в адаптере проекта (`VkAppAdapter`). В этом проекте это `src/messengers/adapters/app-vk.adapter.ts`.

---

## Как бот получает события

Модуль работает через **Bots Long Poll API**: сервер сам держит соединение с VK (`groups.getLongPollServer` → цикл `a_check`, `bot/vk-long-poll.service.ts`) и забирает события из ответа.

- **Callback API не используется.** VK к нам запросов не делает: входящего эндпоинта, строки подтверждения (`type: "confirmation"`), секретного ключа и ответа `"ok"` нет. Включать Callback API в настройках сообщества не нужно.
- Единственный «ответ» VK — на нажатие callback-кнопки (`message_event`): `messages.sendMessageEventAnswer`, иначе у кнопки крутится бесконечная загрузка. Это делает `VkCallbackContext.answer()`.
- Сбой соединения не роняет сервер: цикл логирует ошибку и переподключается с паузой 5 с, 10 с, … до 60 с.

---

## Подключение

### 1. Настройки сообщества VK

Всё в «Управление» сообщества:

1. **Сообщения** → «Сообщения сообщества: Включены». Без этого бот не может писать.
2. **Сообщения → Настройки для бота** → «Возможности ботов: Включены». Без этого не работают клавиатуры и callback-кнопки, а через них подтверждаются вход и привязка.
3. **Работа с API → Ключи доступа** → создать ключ с правами **«Сообщения сообщества»** и **«Управление сообществом»**. Это `VK_BOT_TOKEN`.
4. **Работа с API → Long Poll API** → «Long Poll API: Включён», **версия API 5.199** (`VK_API_VERSION` в `vk.constants.ts`).
5. **Long Poll API → Типы событий** → отметить:
   - `message_new` — входящее сообщение (в нём приходит `ref` диплинка входа/привязки);
   - `message_event` — нажатие callback-кнопки;
   - `message_allow` — пользователь разрешил сообщения;
   - `message_deny` — пользователь запретил сообщения.

   При старте модуль сам пытается включить Long Poll и эти события (`groups.setLongPollSettings`). Если у ключа нет права «Управление сообществом», в логе будет `warn`, и их нужно отметить вручную.

### 2. Мини-приложение VK (необязательно)

Нужно только для запуска фронта внутри VK. Бот, вход через QR, привязка и уведомления работают и без него.

1. [vk.com/apps?act=manage](https://vk.com/apps?act=manage) → создать мини-приложение, адрес — URL фронта (`FRONTEND_URL`).
2. В настройках приложения взять **ID приложения** → `VK_APP_ID` и **защищённый ключ** → `VK_APP_SECRET`.
3. Привязать приложение к сообществу, чтобы кнопка «Открыть приложение» в сообщениях бота открывала его прямо в VK (`open_app`).

Без `VK_APP_SECRET` запросы из мини-приложения получают 401 «Мини-приложение VK не настроено на сервере». Без `VK_APP_ID` кнопка «Открыть приложение» ведёт на `FRONTEND_URL` обычной ссылкой.

### 3. Переменные окружения

```env
VK_BOT_TOKEN="..."   # ключ доступа сообщества (шаг 1.3)
VK_GROUP_ID=123456   # id сообщества, положительное число — из него собираются ссылки https://vk.me/club<id>
VK_APP_ID=           # необязательно: id мини-приложения
VK_APP_SECRET=       # необязательно: защищённый ключ мини-приложения
```

`FRONTEND_URL` (общий для сервера) используется как адрес кнопки «Открыть приложение», если не задан `VK_APP_ID`.

Модуль подключается, только если заданы `VK_BOT_TOKEN` и положительный `VK_GROUP_ID` (`src/messengers/app-messengers.ts`). Иначе в логе `🟦 ❌ VK выключен …`, и сервер стартует без VK.

> **Генерация API.** Пока VK выключен, `VkController` не регистрируется и эндпоинтов `vk` нет в `/api/docs-json`. Если в таком состоянии запустить `yarn api:generate` (orval с `clean: true`), он удалит `generated/vk` и фронт перестанет собираться. Для генерации без настоящего сообщества хватит заглушек `VK_BOT_TOKEN=dummy`, `VK_GROUP_ID=1`: сервер не упадёт, Long Poll будет раз в минуту писать в лог ошибку переподключения.

### 4. Проверка после запуска

В логе (фильтр по `🟦`):

| Строка                                          | Значит                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `✅ VK подключён: сообщество club<id>`          | env заданы, модуль зарегистрирован                                        |
| `Настройки Long Poll сообщества обновлены: …`   | события включены автоматически                                            |
| `Не удалось включить события Long Poll (…)`     | у ключа нет «Управление сообществом» — включите события вручную (шаг 1.5) |
| `✅ Long Poll запущен, сообщество club<id>`     | бот получает события                                                      |
| `❌ Long Poll упал (попытка N), повтор через …` | неверный токен или id, либо Long Poll выключен в сообществе               |

### 5. Схема Prisma

```prisma
model User {
  vkId   String? @unique // id пользователя VK
  vkData Json?           // профиль: имя, screen_name, photo_200
  data   Json?           // служебные маркеры: vkDialogStartedAt / vkDialogClosedAt
  email  String?         // необязателен, используется адаптером проекта
  // ...
}
```

Подключённый `MessengersModule.forRoot({ userStore })`. Также `VK` в enum `NotificationChannel`.

### 6. Адаптер проекта

Наследник `VkAppAdapter` с тремя обязательными методами — как у MAX (см. `src/messengers/max/README.md`):

```ts
@Injectable()
export class AppVkAdapter extends VkAppAdapter {
  // Вход подтверждён в чате → выдать сессию
  async issueWebSession(user: User): Promise<VkWebSession> {
    /* ... */
  }

  // Привязка подтверждена → записать vkId в веб-аккаунт или слить существующий VK-аккаунт в него
  async linkAccount({ targetUserId, vkUser, existingUser }): Promise<User> {
    /* ... */
  }

  // Как назвать аккаунт в вопросе «Привязать к аккаунту …?»
  async describeAccount(userId: number): Promise<string | null> {
    /* email */
  }

  // Необязательно: welcomeText(), welcomeLinks(), welcomeCallbacks(user), onCallback(ctx, user), onMessage(ctx, user)
}
```

Ошибка из `linkAccount` (`throw new Error('понятный текст')`) показывается пользователю в чате.

### 7. Регистрация

```ts
VkIntegrationModule.forRoot({
  token: process.env.VK_BOT_TOKEN!,
  groupId: 123456,
  appId: 7654321,                     // необязательно
  appSecret: process.env.VK_APP_SECRET, // необязательно
  webAppUrl: process.env.FRONTEND_URL,  // для кнопки «Открыть приложение» без appId
  adapter: AppVkAdapter,
  authGuard: MultiAuthGuard,          // guard проекта, кладущий пользователя в req.user
  imports: [AppMessengersSupportModule], // откуда адаптер берёт свои зависимости
}),
```

Модуль **глобальный**: `VkBotService`, `VkDialogService`, `VkAuthStrategy` инжектятся в любом модуле без импорта. Так как VK может быть выключен, снаружи модуля его сервисы инжектятся через `@Optional()` с проверкой на `undefined`.

### 8. Стратегия авторизации в guard проекта

`VkAuthStrategy` добавлена в `MultiAuthGuard` (`src/common/guards/multi-auth.guard.ts`) рядом с Telegram, MAX и JWT. Фронт шлёт `Authorization: vk <launchParams>` — строку `vk_*`-параметров из `window.location.search` вместе с `sign`.

Launch-параметры не несут имени и фото (в отличие от initData Telegram/MAX), поэтому при первом входе модуль один раз тянет профиль через `users.get`.

---

## Использование

### Отправить уведомление

Через общий слой мессенджеров (`src/messengers`, см. README там):

```ts
const vk = this.messengers.get('VK')
if (vk?.canDeliver(user)) await vk.send(user, { text, buttons: [[{ kind: 'open_app', text: 'Открыть' }]] })
```

- `canDeliver` — VK привязан **и** сообщения от сообщества разрешены. Иначе VK ответит ошибкой 901.
- Если отправка упала с 18 / 901 / 902 (`VK_UNREACHABLE_ERROR_CODES`), `sendMessage` сам пометит чат закрытым, и следующие отправки отфильтруются.
- payload callback-кнопки — до 255 байт: длинный payload отклонит весь `messages.send`.

`VkBotService` напрямую — только для VK-специфичного (тест-сообщение в админке).

### Свои кнопки в сообщениях

`callbackButton(text, payload)` кладёт строку в поле `p` JSON-payload кнопки. Нажатие, которое не распознал модуль, приходит в `VkAppAdapter.onCallback(ctx, user)`: вернуть `true`, если кнопка ваша. Не забудьте `ctx.answer()`.

### Разрешение сообщений из мини-приложения

Фронт вызывает `VKWebAppAllowMessagesFromGroup`, затем `POST user/me/vk/messages-allowed/sync`. Ответу попапа не верим: сервер спрашивает VK (`messages.isMessagesFromGroupAllowed`) и сам ставит или снимает маркер. Событие `message_allow` приходит не всегда (разрешение было дано раньше, Long Poll был недоступен).

### Статус для админки/фронта

`getVkDialogState(user.data)` → `{ startedAt, closedAt }`, `isVkDialogOpen(user.data)`.

---

## HTTP API

| Метод  | Путь                               | Доступ      | Что делает                                                                                    |
| ------ | ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `GET`  | `vk/public-config`                 | публичный   | `{ groupId, appId }` — фронту нужны до входа                                                  |
| `POST` | `auth/vk-login/start`              | публичный   | `{ token, url, expiresAt }` — ссылка на чат с сообществом для QR                              |
| `GET`  | `auth/vk-login/status?token=`      | публичный   | `pending` / `confirmed` (+ `accessToken`, `user`, отдаётся один раз) / `rejected` / `expired` |
| `POST` | `user/me/link-vk/start`            | `authGuard` | `{ url, expiresAt }` — ссылка привязки к текущему аккаунту                                    |
| `POST` | `user/me/vk/messages-allowed/sync` | `authGuard` | `{ allowed }` — сверить с VK, разрешены ли сообщения                                          |

Отвязка — `POST user/me/vk/unlink` в модуле пользователей проекта. Подтверждения входа/привязки через HTTP **нет намеренно**: только кнопкой в чате.

---

## Сценарии подробно

### Вход в веб через VK

```
Браузер                          Сервер                              VK (чат с сообществом)
POST auth/vk-login/start  →      токен (pending, 5 мин)
показывает QR (url)                                                  пользователь открывает vk.me/club<id>?ref=login_<t>
                                                                     и жмёт «Начать» / пишет сообщение
                                 message_new ref=login_<t>  ←
                                 «Войти в браузере?» [Подтвердить] [Отклонить] →
                                 ← message_event «Подтвердить»
                                 adapter.issueWebSession(user)
GET status → confirmed + JWT
```

VK отдаёт `ref` только вместе с **первым сообщением** после перехода по ссылке. Поэтому пользователь должен нажать «Начать» или что-то написать. Само открытие чата событий не даёт.

### Привязка VK к веб-аккаунту

То же самое, но `?ref=link_<token>` (10 мин). Бот показывает, **к какому аккаунту** идёт привязка (`describeAccount`) — защита от чужой ссылки привязки. После «Привязать» вызывается `adapter.linkAccount`. Сообщение пользователя уже дало сообществу право писать, поэтому уведомления начинают доходить сразу.

---

## Совместимость payload

Строки ниже живут в уже отправленных сообщениях. Менять их можно только с поддержкой старого значения:

| Где           | Значение                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| диплинк `ref` | `login_<token>`, `link_<token>`                                                                 |
| кнопки модуля | `vk_login:confirm:/reject:<token>`, `vk_link:confirm:/reject:<token>`, `vk:notifications:check` |
| формат кнопки | `{"p":"<строка>"}` в payload callback-кнопки                                                    |

---

## Ограничения

- **Один процесс на сообщество.** Long Poll — это не очередь: каждый инстанс сервера получит все события, и бот ответит дважды. При нескольких инстансах нужно либо поднимать Long Poll только на одном, либо перейти на Callback API (эндпоинт `POST vk/callback` с ответом на `confirmation`, проверкой `secret`, быстрым `"ok"` и дедупликацией по `event_id`).
- **Токены входа/привязки хранятся в памяти** (`deeplink/vk-token-store.ts`). Перезапуск сервера сбрасывает незавершённые входы. При нескольких инстансах нужен Redis/БД.
- **Только личные сообщения.** Беседы (`peer_id ≥ 2e9`) игнорируются.

## Зависимости

`@nestjs/swagger`, `@nestjs/throttler` (`@Throttle` — нужен глобальный throttler guard), `class-validator`. От проекта модуль не зависит: пользователи — через `MessengerUserStore`, OpenAPI — свой `MessengerApi` (`messenger-api.decorator.ts`). SDK VK не нужен: запросы к API идут через `fetch` (`api/vk-api.client.ts`).

## Структура

```
vk/
├── index.ts                    — публичный API, импортировать только отсюда (`@/messengers/vk`)
├── vk-integration.module.ts    — VkIntegrationModule.forRoot(options)
├── vk-app.adapter.ts           — контракт с проектом (abstract class)
├── vk.types.ts / vk.constants.ts
├── api/vk-api.client.ts        — вызовы методов VK API
├── auth/                       — проверка подписи launch-параметров мини-приложения
├── bot/vk-long-poll.service.ts — цикл Bots Long Poll, включение событий сообщества
├── bot/vk-bot.service.ts       — sendMessage, клавиатуры, ответы на нажатия, профиль
├── bot/vk-bot.update.ts        — события сообщества, кнопки входа/привязки
├── messenger/                  — VK как реализация общего контракта MessengerChannel
├── deeplink/                   — вход, привязка, хранилище токенов, сборка ссылок vk.me
├── dialog/                     — разрешены ли сообщения (чистые функции + сервисы над БД и VK)
└── controller/, dto/, guards/  — HTTP-эндпоинты
```

## Фронт

`apps/frontend/src/features/vk` (см. README там) и мост VK Mini Apps — `apps/frontend/src/shared/miniapp/vk-bridge.ts`.
