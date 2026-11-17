# @app/support-chat-client

Headless SDK чата поддержки для браузера — без фреймворка: состояние в сторах, UI подписывается на них.
Сервер — `@app/support-chat-nest`, готовый интерфейс на React — `@app/support-chat-react`.

## Посетитель

```ts
const visitor = new SupportVisitorClient({
  baseUrl: 'https://api.example.com/api',
  // Залогиненный пользователь попадёт в чат под своим аккаунтом; без авторизации — анонимом
  getAuthorization: () => (token ? `Bearer ${token}` : null),
})

await visitor.start()
visitor.store.subscribe(() => render(visitor.store.getState(), visitor.timeline.store.getState()))

visitor.send('Здравствуйте', files)
visitor.send('12345', [], { replyTo: message }) // ответ на сообщение ленты
await visitor.loadOlder() // история вверх
await visitor.markRead()
```

`visitor.store` — сессия, текущий диалог, `unread`, «оператор печатает», операторы онлайн, статус соединения.
`visitor.timeline.store` — лента: `messages`, `loading` (первая загрузка), `loadingOlder`, `hasMoreBefore`.

## Оператор

```ts
const operator = new SupportOperatorClient({ baseUrl, getAuthorization })
operator.connect()
operator.setFilters({ status: ['OPEN'] }) // список диалогов с пагинацией — operator.store

const conversation = operator.openConversation(42) // своя лента и действия; закрыть — conversation.dispose()
conversation.send('Добрый день', files, { internal: false, replyTo: message })
```

## Лента

- **Очередь отправки.** Сообщение сразу в ленте (`localStatus: 'sending'`), уходит по одному, при сбое сети
  повторяется с тем же `clientMessageId` — сервер не создаст дубль; на 4xx — `failed`, его можно `retry` или
  `discard`. Текстовые сообщения очереди переживают перезагрузку страницы (localStorage), файлы — только в памяти.
- **Синхронизация по `seq`.** После переподключения и при пропуске в `seq` лента добирает `afterSeq`.
- **Ответы.** У сообщения `replyTo` — цитата оригинала; неотправленное показывает её сразу.
  `toSupportReply(message)` — цитата из сообщения ленты. `timeline.loadUntil(seq)` догружает историю вверх,
  пока оригинал не окажется в ленте, — для перехода к цитате.
- **Переподключение** с нарастающей задержкой и разбросом; при возврате на вкладку и появлении сети — сразу.
