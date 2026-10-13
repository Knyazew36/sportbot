# Frontend — шаблон кабинета

React 19 + Vite + TanStack Query + React Router 7 + Tailwind 4 + shadcn (base-ui). Структура — FSD.

## Запуск

```bash
yarn dev            # http://localhost:5173, API из .env.development
yarn build          # нужен VITE_API_URL в .env.production
yarn check-types && yarn lint
yarn api:generate   # хуки по Swagger запущенного сервера → src/shared/api/generated
```

## Структура

| Слой | Что лежит |
| --- | --- |
| `app` | провайдеры, роутер (`router/routes.ts` — список страниц), гварды, граница ошибок |
| `pages` | страницы: вход и регистрация, рабочие области, участники, приглашения, заявки, уведомления, журнал, настройки, профиль |
| `widgets` | оболочка кабинета (`app-shell`), меню профиля |
| `entities` | запросы и типы сущностей сервера; `session` — профиль, выход, права (CASL) |
| `shared` | `api` (клиент, типы ответа, `http`), `config/paths` (маршруты), `ui/kit` (свои компоненты), `ui/shadcn` (сгенерированные — руками не править) |

## Как добавить

- **Страницу**: шаблон пути в `shared/config/paths.ts` → запись в `app/router/routes.ts` (`can` — право доступа) → пункт в `widgets/app-shell/nav.ts`.
- **Ссылку**: только `buildPath(ROUTES.X, { orgId })`: параметры проверяются типами.
- **Сущность**: `entities/<name>/api.ts` с хуками на `http.get/post` (мутации только POST) или сгенерировать через orval.
- **Право**: субъект в `entities/session/ability.tsx` и в `apps/server/src/common/casl` одинаково.
- **Список**: `usePageParam` + `Pagination` + `QueryState`; ответ сервера — `Paginated<T>`.

Организация берётся из адреса `/app/:orgId` и уходит заголовком `x-organization-id`.
Название продукта — `shared/config/app.ts` и `<title>` в `index.html`.
