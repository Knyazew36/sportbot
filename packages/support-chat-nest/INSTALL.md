# Установка чата поддержки в проект

Пошаговая инструкция для того, кто разворачивает чат в новом проекте, — человека или ИИ-агента.
Шаги идут по порядку, после каждого — проверка; не переходить дальше, пока проверка не прошла.

Комплект — четыре пакета: `@app/support-chat-core`, `@app/support-chat-nest`, `@app/support-chat-client`,
`@app/support-chat-react`. Что за что отвечает — в `README.md` этого пакета.

Готовые образцы, которые копируются в проект и правятся по пометкам `// ЗАМЕНИТЬ:`:

| Где | Что |
| --- | --- |
| `support-chat-nest/examples/server/prisma-support.store.ts` | `SupportStore` на Prisma — копируется почти как есть |
| `support-chat-nest/examples/server/app-support-identity.ts` | `SupportIdentity` — под Bearer JWT |
| `support-chat-nest/examples/server/app-support-file-storage.ts` | `SupportFileStorage` — картинки на локальном диске |
| `support-chat-nest/examples/server/app-support-notifier.ts` | `SupportNotifier` — заготовка, пишет в лог |
| `support-chat-nest/examples/server/app-support.ts` | подключение модуля с адаптерами |
| `support-chat-react/examples/support-clients.ts` | клиенты посетителя и оператора |
| `support-chat-react/examples/SupportChatWidget.tsx` | плавающий виджет для корневого лейаута |
| `support-chat-react/examples/SupportOperatorPage.tsx` | страница инбокса операторов |
| `support-chat-react/examples/support-theme.css` | стили и цвета под проект |

## 0. Вопросы к человеку — до начала работы

Ответы на них не выводятся из кода. Агент задаёт их и не придумывает сам:

1. **Кто операторы?** Какое правило в модели пользователя (роль, флаг, команда) даёт право отвечать клиентам.
2. **Авторизация.** Как сервер узнаёт пользователя: Bearer JWT, cookie-сессия, несколько стратегий? Какой guard
   кладёт пользователя в `req.user`?
3. **Файлы.** Хранить вложения на локальном диске (образец) или в своём файловом сервисе / S3?
4. **Оповещения.** Нужны ли вне чата (почта, Telegram, push) — кому и куда? Можно не делать.
5. **Где виджет.** На каких страницах фронта плавающая кнопка, на каком адресе инбокс операторов.
6. **Ключ пространства** (`workspaceKey`) — короткое имя проекта, например `my-app`.

Если проект не на Prisma — хранилище пишется по контракту из шага 4, образец служит описанием логики.

## 1. Пакеты в проекте

- Монорепо на yarn workspaces: скопировать четыре папки в `packages/`, выполнить `yarn install`.
- Обычный проект: опубликовать пакеты в приватный registry (убрать `"private": true`) и поставить оттуда.

Собрать строго по зависимостям — приложение подключает пакеты из их `dist`, его нет в git:

```bash
(cd packages/support-chat-core && yarn build)
(cd packages/support-chat-client && yarn build)
(cd packages/support-chat-nest && yarn build)
(cd packages/support-chat-react && yarn build)
```

Те же четыре строки — в скрипт деплоя, до сборки сервера и фронта.

**Проверка:** у всех четырёх пакетов появился `dist/`, у `support-chat-react` — `dist/styles.css`.

## 2. Зависимости сервера

Поставить в серверное приложение то, чего нет: `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`,
`@nestjs/swagger`, `@nestjs/throttler`, `class-validator`, `class-transformer`, `multer` (+ `@types/multer`).
Для образца `SupportIdentity` — `@nestjs/jwt`.

**Проверка:** `tsc --noEmit` сервера проходит, как и до установки.

## 3. Схема БД

Скопировать модели и enum'ы из `support-chat-nest/prisma/support.prisma` в схему приложения без изменений —
они ни на что в проекте не ссылаются. Затем:

```bash
npx prisma migrate dev --name support_chat
```

**Проверка:** миграция создала таблицы `SupportContact`, `SupportConversation`, `SupportMessage`,
`SupportAttachment`; `prisma generate` прошёл.

## 4. Адаптеры портов

Положить образцы из `examples/server/` в модуль приложения (например, `src/support/`) и пройти все пометки
`// ЗАМЕНИТЬ:` — импорты Prisma, guard, правило «кто оператор», поля пользователя.

### `SupportStore` — контракт

Общие правила: «не найдено» (в том числе не прошло фильтр `scope`) — `null`, а не исключение; принадлежность
проверяется в `where` той же мутации, а не отдельным запросом. `scope.workspaceKey` есть всегда, `scope.contactId` —
у посетителя (видит только своё).

| Метод | Что должен делать |
| --- | --- |
| `findContactByAnonymousKey(workspaceKey, key)` | контакт анонима по ключу из его браузера |
| `upsertContactByExternalUserId(workspaceKey, userId, patch)` | контакт пользователя проекта: найти или создать; `undefined` в `patch` не затирает поля |
| `createContact(input)` | новый контакт |
| `updateContact(id, workspaceKey, patch)` | имя/почта/телефон; нет контакта — `null` |
| `mergeContacts(fromId, intoId)` | аноним вошёл в аккаунт: перенести диалоги и его сообщения (`authorId`) к опознанному, анонимный удалить — одной транзакцией |
| `findConversation(id, scope, { withContact })` | диалог в `scope` |
| `findActiveConversation(contactId, workspaceKey)` | последний диалог контакта со статусом не `CLOSED` |
| `listConversations(query)` | постранично, `{ items, meta }`; фильтры статуса, исполнителя (`null` — без исполнителя), канала, поиск по имени/почте/телефону контакта; сортировка — последнее сообщение, новые сверху; `withLastMessage` — последнее сообщение диалога |
| `createConversation(input)` | контакт не из этого workspace — `null` |
| `updateConversation(id, scope, patch)` | статус, исполнитель, теги, оценка |
| `deleteConversation(id, scope)` | удалить с сообщениями; вернуть пути вложений — модуль удалит файлы |
| `markRead(conversationId, scope, side, seq)` | `readSeq = max(текущий, min(seq, lastSeq))` — назад не двигать; пересчитать непрочитанное этой стороны: у клиента — сообщения `OPERATOR`/`BOT` не заметки, у операторов — `CONTACT`; удалённые не считаются |
| `appendMessage(conversationId, scope, input, effects)` | см. ниже |
| `listMessages(query)` | по возрастанию `seq`; `beforeSeq` — `limit` сообщений до него, `afterSeq` — после, без курсора — последние `limit`; `hasMore` — есть ещё в этом направлении; заметки — только при `includeInternal` |
| `findMessage(id, scope)` | сообщение с `contactId` диалога |
| `updateMessageText(id, scope, text)` | только не удалённое, проставить `editedAt` |
| `softDeleteMessage(id, scope)` | `deletedAt`, строка остаётся — иначе в `seq` будет дыра |

`appendMessage` — самое важное место:

- одной транзакцией: `seq = ++lastSeq` через `UPDATE` строки диалога (это и есть блокировка — параллельные
  сообщения получают `seq` строго по очереди), `lastMessageAt`, `effects`, создание сообщения с вложениями;
- `effects.readBy` — эта сторона прочитала всё до нового `seq`; `effects.unreadFor` — +1 непрочитанное этой стороне;
  `effects.status` — новый статус; `effects.assignIfUnassigned` — назначить исполнителя, только если его нет;
- повтор с тем же `clientMessageId` в диалоге не создаёт дубль: уникальный индекс → вернуть существующее
  с `created: false`;
- `replyToId` ставится, только если оригинал из этого же диалога, а на заметку — только если новое сообщение
  тоже заметка; иначе сохранить без цитаты (не ошибка);
- диалога нет в `scope` — `null`.

Каждое сообщение отдаётся с `attachments` (по возрастанию id) и `replyTo` — `{ id, seq, author, authorName, text,
isInternalNote, deletedAt, attachmentsCount }` или `null`.

### Остальные порты

| Порт | Метод | Что должен делать |
| --- | --- | --- |
| `SupportIdentity` | `resolveUser(request)` | пользователь проекта по заголовкам или `null` (аноним); не бросает |
| | `resolveOperator(request)` | оператор `{ id, name }` или `null`; в HTTP пользователь уже в `request.user`, в сокете — только заголовки (`Authorization` из handshake); не бросает |
| | `findOperator(id)` | оператор по id — при назначении диалога на коллегу |
| `SupportFileStorage` | `multerOptions()` | куда multer пишет временный файл, лимиты, допустимые типы |
| | `prepare(file)` | проверить содержимое, вернуть путь для БД; плохой файл — `BadRequestException` |
| | `commit(file)` | перенести из временного места в постоянное (после записи в БД) |
| | `discard(file)` | удалить временный файл (ошибка до commit); отсутствие файла — не ошибка |
| | `toPublicUrl(path)` | ссылка для клиента: абсолютная или от адреса API |
| | `remove(path)` | удалить сохранённый файл |
| `SupportNotifier` | `notifyOperators(conversation, message)` | новое обращение — операторам |
| | `notifyContact(conversation, message)` | ответ оператора, клиента нет онлайн |

**Проверка:** сервер собирается (`tsc --noEmit`), в файлах адаптеров не осталось `ЗАМЕНИТЬ`.

## 5. Подключение модуля

Положить `examples/server/app-support.ts` рядом с адаптерами, задать `SUPPORT_WORKSPACE_KEY`, guard и `imports`.
В `AppModule`:

```ts
imports: [
  ConfigModule.forRoot({ isGlobal: true }), // раньше чата: он читает process.env при создании модуля
  // …
  supportChatModule(),
]
```

`.env` сервера:

| Переменная | Обязательна | Что |
| --- | --- | --- |
| `SUPPORT_CHAT_SECRET` | нет* | подпись токенов визита, ≥ 32 символов; не задана — выводится из `JWT_SECRET` |
| `SUPPORT_IDENTITY_SECRET` | нет | вход на чужом сайте по `userId` + `userHash = HMAC-SHA256(секрет, userId)` |
| `UPLOAD_DIR` | нет | корень загрузок для образца файлового хранилища, по умолчанию `uploads` |
| `MAX_FILE_SIZE` | нет | лимит вложения в байтах, по умолчанию 5 МБ |

\* если нет и `JWT_SECRET` — задать обязательно.

## 6. Инфраструктура сервера

- **CORS:** в `allowedHeaders` добавить `x-support-visit`.
- **Лимиты частоты:** `ThrottlerModule.forRoot(...)` и `ThrottlerGuard` как `APP_GUARD` — иначе `@Throttle`
  на эндпоинтах посетителя не действует.
- **Раздача вложений** для образца файлового хранилища (в `main.ts`, после `setGlobalPrefix`):
  ```ts
  app.useStaticAssets(path.join(UPLOAD_ROOT, SUPPORT_UPLOAD_CATEGORY), {
    prefix: `/${globalPrefix}/uploads/${SUPPORT_UPLOAD_CATEGORY}`,
  })
  ```
  Фронт и API на разных доменах + `helmet` — `crossOriginResourcePolicy: { policy: 'cross-origin' }`, иначе браузер
  не покажет картинки.
- **Прокси (nginx):** для `/socket.io/` пробросить `Upgrade` и `Connection`:
  ```nginx
  location /socket.io/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
  ```
- **Swagger:** ответы описаны с конвертом `{ status, data, timestamp }` (`SupportApi` в пакете). Если интерцептор
  проекта не оборачивает ответы в такой конверт — поправить декоратор, иначе документация разойдётся с ответами.

**Проверка** (сервер запущен):

```bash
curl -X POST <API>/support/session -H 'Content-Type: application/json' -d '{}'
# → токен визита и anonymousKey
```

В логе старта нет ошибок Nest про зависимости модуля чата.

## 7. Фронт

Нужны React ≥ 18 и зависимость `@app/support-chat-react` (она подтянет `client` и `core`).

1. Скопировать `support-chat-react/examples/` в проект (например, `src/features/support/`), пройти `ЗАМЕНИТЬ`:
   адрес API (вместе с глобальным префиксом), заголовок авторизации, цвета темы.
2. `<SupportChatWidget userId={…} />` — один раз в корневом лейауте страниц, где нужен чат.
3. `SupportOperatorPage` — на маршрут инбокса, доступный операторам.

Сайт не на React — взять только `@app/support-chat-client` (README пакета) и нарисовать свой интерфейс.

**Проверка вручную:**

1. Открыть сайт, нажать кнопку чата, отправить сообщение с картинкой.
2. Открыть инбокс под оператором — диалог появился, картинка видна.
3. Ответить из инбокса с цитатой («Ответить» на сообщении клиента) — у клиента ответ пришёл без перезагрузки,
   с цитатой; закрыть окно чата и прислать ещё ответ — на кнопке появилось число непрочитанных.
4. Перезагрузить страницу клиента — переписка на месте.

## Ловушки

- Пакеты — из `dist`: после любой правки в `packages/*` пересобрать (`yarn build` или `yarn dev` в пакете)
  и перезапустить сервер, иначе приложение видит старую версию.
- `supportChatModule()` — после `ConfigModule.forRoot`, иначе секреты прочитаются пустыми.
- `assetBaseUrl` и `baseUrl` клиента — адрес API вместе с глобальным префиксом (`https://api.example.com/api`).
- Сокет работает только через `websocket`: без `Upgrade`/`Connection` в прокси чат «молчит» до перезагрузки.
- Отдельные домены фронта и API: CORS с `x-support-visit` и `credentials` по правилам проекта, `allowedOrigins`
  модуля — тот же список.
- Telegram-мост (тема на обращение в группе операторов) в комплект не входит: он завязан на бота проекта.
  Как его построить — раздел «Мосты в мессенджеры» в `README.md`.
