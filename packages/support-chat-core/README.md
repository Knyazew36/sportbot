# @app/support-chat-core

Общий контракт чата поддержки для сервера и браузера:

- типы API — `SupportMessage`, `SupportMessageReply` (цитата в ответе), `SupportConversation`, `SupportContact`,
  статусы, авторы, каналы;
- события socket.io — `SupportServerToClientEvents`, `SupportClientToServerEvents`;
- лимиты — `SUPPORT_LIMITS`: длина текста, число вложений, размер страницы истории, тайминги «печатает…».

Сервер и клиент собираются по одним и тем же типам: поменялось поле в API — ошибка видна на обеих сторонах сразу.

Без зависимостей. Сборка двойная: CJS для Node (`require`), ESM для бандлеров (`import`).
Описание всего комплекта — в README пакета `@app/support-chat-nest`.
