# @app/support-chat-nest

Чат поддержки для NestJS: REST посетителя и операторов, socket.io-неймспейс `/support`, сервисы.
Всё, что зависит от приложения (хранилище, авторизация, файлы, оповещения), приходит через порты: модуль
не знает ни про БД, ни про пользователей проекта.

## Комплект

| Пакет | Где | Что |
| --- | --- | --- |
| `@app/support-chat-core` | сервер + браузер | общий контракт: типы API, события сокета, лимиты |
| `@app/support-chat-nest` | сервер | этот модуль |
| `@app/support-chat-client` | браузер | headless SDK: REST, сокет, лента с очередью отправки |
| `@app/support-chat-react` | браузер | виджет посетителя и инбокс оператора |

Зависимости идут в одну сторону: `core` ← `nest`, `core` ← `client` ← `react`. Сервер не тянет React,
браузерный SDK не привязан к фреймворку.

**Развернуть в новом проекте — по [`INSTALL.md`](./INSTALL.md)**: вопросы, которые решает человек, шаги
с проверками, контракт каждого метода портов, ловушки. Готовые адаптеры для копирования — в `examples/server/`,
обвязка фронта — в `examples/` пакета `@app/support-chat-react`.

## Установка

Пакеты подключаются из собранного `dist`, поэтому их нужно собрать до приложения — строго по зависимостям:

```bash
(cd packages/support-chat-core && yarn build)
(cd packages/support-chat-client && yarn build)
(cd packages/support-chat-nest && yarn build)
(cd packages/support-chat-react && yarn build)
```

То же — в скрипте деплоя, до сборки сервера и фронта. В монорепо на yarn workspaces папки пакетов кладутся
в `packages/`; в обычный проект — через приватный registry (убрать `"private": true`, поднимать версию).

Peer-зависимости сервера: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/platform-socket.io`,
`@nestjs/swagger`, `@nestjs/websockets`, `@nestjs/throttler`, `socket.io`, `class-validator`, `class-transformer`, `rxjs`.

## Подключение

### 1. Схема БД

Скопировать модели из `prisma/support.prisma` в схему приложения и сделать миграцию. Без Prisma схема —
описание таблиц и связей для своего хранилища.

### 2. Порты

Классы-провайдеры в приложении; абстрактные классы экспортируются из пакета. Образцы всех четырёх —
в `examples/server/`, контракт каждого метода — в `INSTALL.md`, шаг 4.

| Порт | Что делает |
| --- | --- |
| `SupportStore` | хранение контактов, диалогов и сообщений |
| `SupportIdentity` | кто посетитель (`resolveUser`, необязательная авторизация приложения), кто оператор (`resolveOperator`), оператор по id (`findOperator`) |
| `SupportFileStorage` | настройки multer, проверка файла, перенос из временной папки, публичный URL |
| `SupportNotifier` | необязательный: оповещения вне чата — «новое обращение» операторам, «ответили» клиенту, если его нет онлайн |

Контракт `SupportStore`, на который опирается модуль:

- «Не найдено» (в том числе не прошло фильтр `scope`) — `null`, а не исключение. Принадлежность проверяется
  в `where` той же мутации, а не отдельным запросом.
- `appendMessage` выдаёт `seq = ++lastSeq` под блокировкой строки диалога и атомарно применяет `effects`
  (статус, счётчики непрочитанного, прочтение, назначение). Повтор с тем же `clientMessageId` в диалоге
  не создаёт дубль — возвращает существующее сообщение с `created: false`.
- `replyToId` ставится, только если оригинал из этого же диалога; на заметку операторов — только из заметки,
  иначе клиент увидел бы её текст в цитате. Недоступный id — сообщение сохраняется без цитаты.
- Сообщения отдаются с `replyTo` — сжатой цитатой оригинала (`id`, `seq`, автор, текст, число вложений, `deletedAt`).
- `listMessages` — по возрастанию `seq`, курсор `beforeSeq` (вверх) или `afterSeq` (добор), признак `hasMore`.

### 3. Модуль

```ts
SupportChatModule.forRoot({
  workspaceKey: 'my-app', // один бэкенд может обслуживать несколько сайтов
  secret: process.env.SUPPORT_CHAT_SECRET!, // ≥ 32 символов — подпись токенов визита
  identitySecret: process.env.SUPPORT_IDENTITY_SECRET, // необязательно: вход с подписью пользователя на чужом сайте
  allowedOrigins: origin => allowed.includes(origin), // проверка origin сокета; не задано — любые
  store: MySupportStore,
  identity: MySupportIdentity,
  files: MySupportFileStorage,
  notifier: MySupportNotifier, // необязательный
  authGuard: MyAuthGuard, // guard приложения, кладущий пользователя в req.user, — им закрыты эндпоинты операторов
  imports: [FilesModule], // модули, от которых зависят провайдеры портов
})
```

Вход с подписью пользователя: сайт на своём бэке считает `userHash = HMAC-SHA256(identitySecret, userId)` в hex
и передаёт его виджету вместе с `userId` — посетитель попадёт в чат под своим аккаунтом без общей авторизации.

### 4. Инфраструктура

- CORS приложения: разрешить заголовок `x-support-visit` (токен визита посетителя).
- Прокси: для `/socket.io/` пробросить `Upgrade` и `Connection` — сокет работает только через `websocket`.
- Лимиты частоты (`@Throttle` на эндпоинтах посетителя) действуют, если в приложении подключён `ThrottlerModule`
  с `ThrottlerGuard`; без него это просто метаданные.
- Ответы описаны в Swagger с конвертом `{ status, data, timestamp }` (декоратор `SupportApi`). Если в приложении
  конверта нет — поправить декоратор.

## Транспорт

Мутации — REST `POST`, события — socket.io (только `websocket`, без sticky-сессий). Сокет — подсказка
«что-то изменилось»; пропущенное при обрыве клиент добирает `GET message/list?afterSeq=`.

| Посетитель (`x-support-visit`) | |
| --- | --- |
| `POST support/session` | вход: аноним по `anonymousKey`, пользователь приложения по его авторизации или `userId` + `userHash` |
| `GET support/conversation/current` | текущий незакрытый диалог |
| `GET support/message/list` | история: `beforeSeq` — вверх, `afterSeq` — добор |
| `POST support/message/create` | multipart: `text`, `clientMessageId`, `replyToId`, `files[]` |
| `POST support/message/update/:id`, `delete/:id` | свои сообщения, 15 минут |
| `POST support/conversation/read` | прочитано до `seq` |
| `POST support/conversation/rate` | оценка 1–5 |

| Оператор (`authGuard` + `SupportIdentity.resolveOperator`) | |
| --- | --- |
| `support/operator/conversation/*` | `create`, `list` (`filter_status`, `filter_assignee`, `filter_channel`, `search`, `add_contact`, `add_last_message`), `:id`, `update/:id`, `delete/:id`, `assign/:id`, `close/:id`, `reopen/:id`, `read` |
| `support/operator/message/*` | `create` (multipart: `text`, `clientMessageId`, `replyToId`, `isInternalNote`, `files[]`), `list`, `:id`, `update/:id`, `delete/:id` |

Сокет: `handshake.auth.visitToken` (посетитель) или `handshake.auth.authorization` — заголовок Authorization
приложения целиком (оператор). События — `SupportServerToClientEvents` в `@app/support-chat-core`.
Заметки операторов посетителю не уходят ни по REST, ни по сокету.

Служебные строки в ленте модуль пишет сам: смена статуса («Обращение закрыто»), назначение
(«К диалогу подключился оператор» — без имени).

## Мосты в мессенджеры

Модуль экспортирует то, на чём строится зеркалирование переписки во внешний канал (например, тему в группе
операторов Telegram):

- `SupportEvents.stream` — доменные события: `message.created`, `message.updated`, `message.deleted`,
  `conversation.updated`, `conversation.deleted`, `conversation.read`. Сообщение несёт `channel` — то, что пришло
  из самого канала, обратно туда не отправляют.
- `SupportOperatorService.createMessage(operator, dto, files, channel)` — ответ оператора из канала: с `replyToId`,
  `isInternalNote` и вложениями, как из веб-панели.
- `SupportStore` — найти диалог, контакт.

Чтобы «Ответить» работало в обе стороны, мост хранит у себя соответствие «сообщение чата ↔ сообщение в канале»:
по нему ответ из чата уходит нативным reply, а reply в канале превращается в `replyToId`. Для сообщений без такой
связи цитату можно добавить строкой текста.
