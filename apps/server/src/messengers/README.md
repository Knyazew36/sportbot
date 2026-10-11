# Общий слой мессенджеров (`src/messengers`)

Один контракт для всех ботов-мессенджеров (MAX, Telegram, VK). Код проекта, которому
нужно «написать пользователю в мессенджер», работает только с этим слоем и не знает, какой бот внутри.

```
NotificationsService ──► MessengerRegistry.get('MAX' | 'TELEGRAM' | …)
                                │
                 ┌──────────────┼──────────────┐
          MaxMessengerChannel  TelegramMessengerChannel  VkMessengerChannel   ← каждый модуль мессенджера
          max/messenger        telegram/messenger        vk/messenger           регистрирует свою реализацию
```

## Структура

```
src/messengers/
├── index.ts, messengers.module.ts,
│   messenger.registry.ts, messenger.types.ts,
│   messenger-api.decorator.ts                 — общий слой (контракт, реестр, хранилище пользователей), импорт через `@/messengers`
├── app-messengers.ts                          — какие мессенджеры подключить (по env), вызывается из app.module.ts
├── max/, telegram/, vk/                       — модули мессенджеров (переносимые, импорт через `@/messengers/max` и т.п.);
│                                                настройка бота, env и сценарии — README.md в каждом
└── adapters/                                  — проектная логика: App*Adapter, PrismaMessengerUserStore, логика аккаунтов
                                                 (app-messenger-accounts.service.ts), тексты ботов (app-messenger-texts.ts)
```

## Граница «ядро / проект»

Ядро — общий слой и папки `max/`, `telegram/`, `vk/`. Оно не импортирует ничего из проекта: ни Prisma,
ни `@/common`, ни сервисы. Всё, что ему нужно от проекта, приходит через три точки:

- `MessengerUserStore` — как найти, завести и обновить пользователя (реализация: `adapters/prisma-messenger-user.store.ts`);
- `*AppAdapter` — сессии, привязка аккаунтов, приветствие, свои кнопки и команды (`adapters/app-*.adapter.ts`);
- `authGuard` — guard обычной сессии проекта для эндпоинтов привязки.

Проектное — только `adapters/` и `app-messengers.ts`. Поэтому ядро можно вынести в отдельный пакет
переносом папок, а в новом проекте переписать одни адаптеры.

## Контракт

```ts
interface MessengerChannel {
  channel: 'MAX' | 'TELEGRAM' | 'VK' // ключ = значение NotificationChannel
  canDeliver(user: MessengerUser): boolean // привязан ли и может ли бот писать прямо сейчас
  send(user: MessengerUser, message: MessengerMessage): Promise<void>
}

type MessengerButton =
  | { kind: 'open_app'; text: string } // открыть мини-приложение бота
  | { kind: 'link'; text: string; url: string }
  | { kind: 'callback'; text: string; payload: string } // нажатие придёт в обработчик кнопок мессенджера
```

Кнопки абстрактные: каждый мессенджер сам переводит их в формат своей платформы.

## Использование

```ts
constructor(private readonly messengers: MessengerRegistry) {}

const max = this.messengers.get('MAX')
if (max?.canDeliver(user)) {
  await max.send(user, { text: 'Остаток ниже порога', buttons: [[{ kind: 'open_app', text: 'Открыть' }]] })
}
```

Модуль мессенджера не подключён → `get()` вернёт `undefined`, и канал просто пропускается.
Так уже работает `NotificationsService`: для него все мессенджеры одинаковые.

## Ответ правкой сообщения (кнопка «Обновить» и т.п.)

Когда пользователь нажал callback-кнопку под сообщением бота, ответить можно не новым сообщением, а
правкой того же — как «🔄 Обновить сводку» в сводке дня. Для этого в общем слое есть
`MessengerCallbackMessage` — сообщение, под которым нажали кнопку:

```ts
interface MessengerCallbackMessage {
  channel: 'MAX' | 'TELEGRAM' | 'VK'
  sentAt(): Promise<Date | null> // когда бот его отправил; null — неизвестно
  edit(message: MessengerMessage): Promise<void> // заменить текст и кнопки; бросает, если платформа отказала
}
```

Собирает его канал мессенджера из контекста нажатия — в `onCallback` адаптера проекта
(`adapters/App*Adapter`). Канал инжектится в адаптер (модули мессенджеров глобальные):

```ts
constructor(private readonly telegramChannel: TelegramMessengerChannel) {} // MaxMessengerChannel, VkMessengerChannel

public async onCallback(ctx: Context, user: User | null): Promise<boolean> {
  const source = this.telegramChannel.callbackMessage(ctx)
  // дальше код фичи работает только с source — не знает, какой мессенджер внутри
}
```

Код фичи (пример — `DailySummaryBotService.sendToday`):

```ts
try {
  await source.edit({ text: `🔄 Обновлено в ${formatZonedTime(new Date())}\n\n${text}`, buttons })
} catch {
  await this.messengers.get(source.channel)?.send(user, { text, buttons }) // не вышло — новым сообщением
}
```

`buttons` не передан — кнопки под сообщением убираются (так закрывают одноразовые кнопки: опросы,
подтверждения). Нужны те же кнопки — передать их снова.

### Как это сделано на каждой платформе

|          | `edit`                                                   | `sentAt`                                                                               | Ограничения                                                                                                                              |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| MAX      | `ctx.editMessage` (`PUT /messages`)                      | `ctx.message.timestamp`, без запроса                                                   | Сообщения в личке правятся до 7 суток (с inline-кнопками — без срока). Ответ может прийти 200 с `success: false` — превращается в ошибку |
| Telegram | `ctx.editMessageText`                                    | `callbackQuery.message.date`, без запроса                                              | Тот же текст → ошибка `message is not modified`. У сообщений старше 48 ч `date` = 0 → `sentAt` = null                                    |
| VK       | `messages.edit` по `peer_id` + `conversation_message_id` | отдельный запрос `messages.getByConversationMessageId` (событие нажатия даты не несёт) | Сообщения сообщества правятся около суток                                                                                                |

`edit` у всех трёх бросает ошибку при отказе платформы — решение «что делать вместо» (обычно `send`
новым) остаётся за кодом фичи. `sentAt` не бросает: при сбое вернёт `null`. Вызывать его только если
дата нужна (у VK это лишний запрос).

### Правила, которые стоит повторять в новых фичах

- **Не затирать историю.** Сводка дня правит сообщение, только если оно отправлено сегодня
  (`sentAt` + `startOfZonedDay`); под вчерашним — новое сообщение, чтобы вчерашние цифры остались в чате.
  `sentAt` = null — считаем «не сегодня» и тоже шлём новое.
- **Пометка правки.** Пользователь должен видеть, что сообщение изменилось: строка
  `🔄 Обновлено в HH:MM` сверху. Она же меняет текст, и Telegram не ругается «not modified»
  (кроме повторного нажатия в ту же минуту — его ловим и отвечаем «уже актуально»).
- **Не править «чужие» сообщения.** Кнопка из приветствия бота шлёт сводку новым сообщением —
  приветствие остаётся. Сводка различает это по payload: `ds:now` (приветствие) против `ds:now:<orgId>`.
- **Всплывашка у кнопки** (`answerOnCallback` / `answerCbQuery` / `ctx.answer`) по-прежнему
  отвечает адаптер — `edit` её не заменяет.

### Как добавить в новый мессенджер

В его `*MessengerChannel` — метод `callbackMessage(ctx)`, возвращающий `MessengerCallbackMessage`:
`edit` переводит `MessengerMessage` в формат платформы тем же кодом, что и `send`; `sentAt` берёт дату
из контекста нажатия или отдельным запросом. Если платформа отвечает «ок» с флагом ошибки — бросить.

## Как добавить новый мессенджер (по образцу VK)

1. **Схема:** добавить `VK` в enum `NotificationChannel` и поле для id пользователя (`vkId`) в `User`.
   Это миграция Prisma, её делают вручную. Затем добавить `'VK'` в `MessengerChannelKey` (`messenger.types.ts`).
2. **Модуль** `src/messengers/vk` по образцу `src/messengers/max`: бот, авторизация мини-приложения, вход и привязка, адаптер проекта.
3. **Реализация канала** `VkMessengerChannel implements MessengerChannel, OnModuleInit`:
   в `onModuleInit` вызвать `registry.register(this)`, в `canDeliver` учесть правила платформы
   (у VK — разрешение сообщений от сообщества), в `send` перевести `MessengerButton` в клавиатуру VK.
4. **Уведомления:** добавить `VK` в `availableChannels` нужных событий (`notifications/event-registry.ts`).
   `NotificationsService` менять не нужно.

## Что сюда не входит

Вход, привязка аккаунтов, авторизация мини-приложений и учёт «может ли бот писать» — у каждой
платформы свои правила, поэтому это остаётся в модуле мессенджера. Общий слой отвечает только за
одинаковую отправку.

## Подключение

`MessengersModule.forRoot({ userStore: PrismaMessengerUserStore })` (глобальный) — один раз в `app.module.ts`,
рядом `AppMessengersSupportModule` (логика аккаунтов для адаптеров и регистрация стратегий мини-приложений
в `MultiAuthGuard`). Модули мессенджеров требуют наличия общего слоя.
