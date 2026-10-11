# Модуль MAX (`src/messengers/max`)

Всё, что связано с мессенджером [MAX](https://dev.max.ru), в одном Nest-модуле:

| Возможность                       | Как работает                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Авторизация в мини-приложении** | Фронт шлёт подписанный `initData`, `MaxAuthStrategy` проверяет подпись токеном бота и находит/заводит пользователя по `maxId` |
| **Вход в веб-версию через MAX**   | QR со ссылкой `https://max.ru/<bot>?start=login_<token>` → чат с ботом → кнопка «Подтвердить вход» → браузер забирает JWT     |
| **Привязка MAX к веб-аккаунту**   | Ссылка `?start=link_<token>` → бот спрашивает «Привязать к аккаунту user@mail?» → кнопка «Привязать»                          |
| **Уведомления через бота**        | `MaxBotService.sendMessage` + проверка `MaxDialogService.canDeliver(user)`                                                    |
| **Учёт, открыт ли чат**           | MAX не даёт боту писать первым. Модуль сам отмечает открытие/закрытие чата в `User.data`                                      |

Проектная логика (как выдаются сессии, как сливаются аккаунты, свои кнопки) — **не в модуле**, а в адаптере проекта (`MaxAppAdapter`). В этом проекте это `src/messengers/adapters/app-max.adapter.ts`.

---

## Подключение

### 1. Переменные окружения

```env
MAX_BOT_TOKEN="..."          # токен бота из кабинета партнёра MAX
MAX_BOT_NAME="my_bot"        # имя бота без @, как в https://max.ru/my_bot
MAX_AUTH_TTL_SECONDS=86400   # необязательно: сколько живёт initData мини-приложения (модуль читает сам, по умолчанию сутки)
```

### 2. Схема Prisma

Модулю нужны три поля в модели `User`:

```prisma
model User {
  id      Int     @id @default(autoincrement())
  maxId   String? @unique  // id пользователя в MAX
  maxData Json?            // профиль из initData (имя, username, фото)
  data    Json?            // служебные маркеры: maxDialogStartedAt / maxDialogClosedAt
  email   String?          // необязателен, используется адаптером проекта
  // ...
}
```

И подключённый `MessengersModule.forRoot({ userStore })` — через `MessengerUserStore` модуль ходит к пользователям проекта.

### 3. Адаптер проекта

Наследник `MaxAppAdapter` с тремя обязательными методами:

```ts
@Injectable()
export class AppMaxAdapter extends MaxAppAdapter {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UserService,
  ) {
    super()
  }

  // Вход подтверждён в чате → выдать сессию (JWT и т.п.)
  async issueWebSession(user: User) {
    return { accessToken: this.jwt.sign({ sub: user.id }), user: { id: user.id, email: user.email } }
  }

  // Привязка подтверждена → записать maxId в веб-аккаунт или слить существующий MAX-аккаунт в него
  async linkAccount({ targetUserId, maxUser, existingUser }) {
    /* ... вернуть итогового User */
  }

  // Как назвать аккаунт в вопросе «Привязать к аккаунту …?»
  async describeAccount(userId: number) {
    /* email пользователя */
  }

  // Необязательно: welcomeText(), welcomeLinks(), welcomeCallbacks(user), onCallback(ctx, user), onMessage(ctx, user)
}
```

Ошибка из `linkAccount` (`throw new Error('понятный текст')`) показывается пользователю в чате.

### 4. Регистрация в `app.module.ts`

```ts
MessengersModule.forRoot({ userStore: PrismaMessengerUserStore }), // общий слой мессенджеров (src/messengers) — модуль MAX регистрирует в нём канал 'MAX'
MaxIntegrationModule.forRoot({
  token: process.env.MAX_BOT_TOKEN!,
  botName: process.env.MAX_BOT_NAME!,
  adapter: AppMaxAdapter,
  authGuard: MultiAuthGuard,          // guard проекта, кладущий пользователя в req.user
  imports: [AppMessengersSupportModule], // откуда адаптер берёт свои зависимости
}),
```

Модуль **глобальный**: `MaxBotService`, `MaxDialogService`, `MaxAuthStrategy` инжектятся в любом модуле без импорта.

В этом проекте модуль подключается только при заданных `MAX_BOT_TOKEN` и `MAX_BOT_NAME` (`src/messengers/app-messengers.ts`), иначе — предупреждение в логе и старт без MAX. Поэтому снаружи модуля его сервисы инжектятся через `@Optional()` с проверкой на `undefined`.

### 5. Стратегия авторизации в guard проекта

Чтобы запросы из мини-приложения авторизовались, добавьте `MaxAuthStrategy` в свой guard рядом с JWT:

```ts
const strategies = [this.maxAuthStrategy, this.jwtStrategy]
const strategy = strategies.find(s => s.supports(req))
req.user = await strategy.authenticate(req)
```

Фронт шлёт `Authorization: max <window.WebApp.initData>`. Если заголовок поставить нельзя (`WebApp.downloadFile`), подойдёт query-параметр `?initData=...`.

---

## Использование

### Отправить уведомление

```ts
constructor(private readonly maxBot: MaxBotService, private readonly maxDialog: MaxDialogService) {}

if (this.maxDialog.canDeliver(user)) {
  await this.maxBot.sendMessage(
    user.maxId!,
    'Остаток товара ниже порога',
    this.maxBot.keyboard([[this.maxBot.openAppButton('Открыть приложение')]]),
  )
}
```

- `canDeliver` — MAX привязан **и** пользователь открыл чат с ботом. Иначе MAX ответит `dialog.not.found`.
- Если пользователь закрыл чат, `sendMessage` бросит ошибку и сам пометит чат закрытым — следующие отправки отфильтруются.
- Лимит MAX — 2 сообщения в секунду в один чат.

### Через общий слой мессенджеров

Модуль регистрирует канал `'MAX'` в `MessengerRegistry` (`src/messengers`, см. README там) — реализация
`messenger/max-messenger.channel.ts`. Код, которому не важно, какой мессенджер (уведомления), шлёт так:

```ts
const max = this.messengers.get('MAX')
if (max?.canDeliver(user)) await max.send(user, { text, buttons: [[{ kind: 'open_app', text: 'Открыть' }]] })
```

`MaxBotService` напрямую — только для MAX-специфичного (тест-сообщение в админке, служебные рассылки).

### Свои кнопки в сообщениях

Шлёте `{ type: 'callback', text, payload }`, а нажатие ловите в `MaxAppAdapter.onCallback(ctx, user)`:
вернуть `true`, если кнопка ваша. **Не** вешайте свой `@MaxOn('message_callback')` / `@MaxOn('message_created')`: nestjs-max вызывает только первый обработчик на тип апдейта, и модуль или ваш код перестанет получать события.

### Статус для админки/фронта

`getMaxDialogState(user.data)` → `{ startedAt, closedAt }`, `isMaxDialogOpen(user.data)`.

---

## HTTP API

| Метод  | Путь                           | Доступ      | Что делает                                                                                    |
| ------ | ------------------------------ | ----------- | --------------------------------------------------------------------------------------------- |
| `POST` | `auth/max-login/start`         | публичный   | `{ token, url, expiresAt }` — ссылка на чат с ботом для QR                                    |
| `GET`  | `auth/max-login/status?token=` | публичный   | `pending` / `confirmed` (+ `accessToken`, `user`, отдаётся один раз) / `rejected` / `expired` |
| `POST` | `user/me/link-max/start`       | `authGuard` | `{ url, expiresAt }` — ссылка привязки к текущему аккаунту                                    |

Подтверждения через HTTP **нет намеренно**: вход и привязка подтверждаются только кнопкой в чате бота.

---

## Сценарии подробно

### Вход в веб через MAX

```
Браузер                         Сервер                           MAX (чат с ботом)
POST auth/max-login/start  →    токен (pending, 5 мин)
показывает QR (url)                                              пользователь открывает ссылку
                                bot_started payload=login_<t> ←
                                «Войти в браузере?» [Подтвердить] [Отклонить] →
                                ← нажата «Подтвердить»
                                adapter.issueWebSession(user)
GET status → confirmed + JWT
```

Почему кнопка обязательна: раньше вход подтверждался автоматически при открытии ссылки. Тогда злоумышленник мог прислать жертве свою ссылку входа и получить её сессию в своём браузере.

### Привязка MAX к веб-аккаунту

То же самое, но `?start=link_<token>` (10 мин). Бот показывает, **к какому аккаунту** идёт привязка (`describeAccount`). После «Привязать» вызывается `adapter.linkAccount`, чат отмечается открытым, и уведомления сразу начинают доходить. Фронт узнаёт об успехе по появившемуся `maxId` в профиле.

### Почему `?start=`, а не `?startapp=`

- `?startapp=` открывает мини-приложение. Чат с ботом при этом не открывается, поэтому уведомления не доходят, пока пользователь отдельно не нажмёт «Начать».
- `?start=` открывает **чат**. Одно нажатие даёт и вход/привязку, и разрешение на уведомления.

Отдельного разрешения «бот может мне писать» в MAX нет (в Telegram для этого есть `requestWriteAccess`). Bridge мини-приложения такого метода не даёт, его `PermissionsManager` — только камера и микрофон. Единственный способ — открытый чат с ботом.

---

## Совместимость payload

Строки ниже живут в уже отправленных сообщениях. Менять их можно только с поддержкой старого значения:

| Где           | Значение                                                                                           |
| ------------- | -------------------------------------------------------------------------------------------------- |
| диплинк       | `login_<token>`, `link_<token>` (≤128 символов, иначе MAX молча теряет payload)                    |
| кнопки модуля | `max_login:confirm:/reject:<token>`, `max_link:confirm:/reject:<token>`, `max:notifications:check` |
| старая кнопка | `notifications:check` — ещё обрабатывается                                                         |

---

## Ограничения

- **Токены входа/привязки хранятся в памяти** (`MaxTokenStore`). Это работает для одного процесса сервера. При нескольких инстансах замените хранилище на Redis/БД.
- **Повторный `bot_started`.** По документации MAX переход по ссылке `?start=` присылает `bot_started` с payload. Если у пользователя чат уже открыт, проверьте на своём клиенте, что событие приходит повторно.
- **Polling, а не webhook.** На один токен бота должен работать один процесс — иначе апдейты разойдутся между инстансами. Для webhook см. документацию `max-io` (`node_modules/max-io/docs/webhook.md`).

## Зависимости

`nestjs-max`, `max-io`, `@nestjs/swagger`, `@nestjs/throttler` (`@Throttle` — нужен глобальный throttler guard), `class-validator`. От проекта модуль не зависит: пользователи — через `MessengerUserStore`, OpenAPI — свой `MessengerApi` (`messenger-api.decorator.ts`). DTO ответов описаны без `@ApiProperty`: проект собирается с плагином `@nestjs/swagger` в `nest-cli.json`.

## Структура

```
max/
├── index.ts                    — публичный API, импортировать только отсюда (`@/max`)
├── max-integration.module.ts   — MaxIntegrationModule.forRoot(options)
├── max-app.adapter.ts          — контракт с проектом (abstract class)
├── max.types.ts / max.constants.ts
├── auth/max-auth.strategy.ts   — проверка initData мини-приложения
├── bot/max-bot.service.ts      — polling, sendMessage, клавиатуры
├── bot/max-bot.update.ts       — события чата, кнопки входа/привязки
├── messenger/                  — MAX как реализация общего контракта MessengerChannel
├── deeplink/                   — вход, привязка, хранилище токенов, сборка ссылок
├── dialog/                     — открыт ли чат (чистые функции + сервис над БД)
├── controller/, dto/, guards/  — HTTP-эндпоинты
└── _test_/                     — тесты
```

## Перенос в другой проект

1. Скопировать `src/messengers/max` и общий слой — файлы в корне `src/messengers` (`index.ts`, `messenger.*.ts`, `messengers.module.ts`).
2. Поправить импорт `@Swagger` в `controller/max.controller.ts` под свой проект (или заменить на `@ApiOperation`/`@ApiOkResponse`).
3. Добавить поля `maxId`, `maxData`, `data` в `User` (см. выше).
4. Написать свой адаптер (`extends MaxAppAdapter`) и подключить `MaxIntegrationModule.forRoot(...)`.
5. Добавить `MaxAuthStrategy` в свой guard авторизации.
6. На фронте — `apps/frontend/src/features/max` (см. README там).
