# Правила проекта

## Этап: блоки с логикой, а не макеты

Статичные макеты закончены. Страницы переводим на настоящую логику — запросы через query-хуки.

- Страницу разбиваем на логические блоки.
- Блок нужен только этой странице — кладём в `src/pages/<page>/components/`.




## Запросы

- orval генерирует только функции и типы (`src/shared/api/generated`). Хуки и ключи react-query пишем руками в `src/entities/<entity>`.
- Настройки query едины — `src/shared/api/query-client.ts`. Ошибки запросов и мутаций показывает общий тост оттуда; свой `onError` ради тоста в хуках не пишем.
- Успех любой мутации (каждый POST) показывает общий тост: мутации ставим `meta: { successMessage: '…' }`. Свой `onSuccess` ради тоста не пишем.
- Тост об успехе есть всегда. Молчит только мутация, где он выключен явно: `meta: { skipSuccessToast: true }` и комментарий рядом — почему (результат и так виден на экране). Без `successMessage` и без `skipSuccessToast` покажется общий «Готово» — это признак незаконченного хука.
- Ошибки полей формы (422 с `errors`) показываем под инпутом: мутации ставим `meta: { inlineFieldErrors: true }`, тогда тост для них не дублируется.
- Текст ошибки достаём через `errorCatch` из `@front-cmdt/utils/error-catch`.
- CSRF живёт в интерцепторах `$api` (`src/shared/api/model/csrf.ts`), в хуках про него думать не нужно.
- Действие, которое трогает несколько мест (выход: запрос, кэш, редирект), собираем в одном хуке в `src/features`.

## Лейауты

- Все лейауты лежат в `src/shared/layouts`, каждый в своей папке: `src/shared/layouts/layout-<name>/Layout<Name>.tsx`.
- Название компонента всегда начинается с `Layout`: `LayoutRoot`, `LayoutAuth` — не `RootLayout`.
- То, что нужно только этому лейауту, кладём в его `components/`: `src/shared/layouts/layout-auth/components/Showcase.tsx`.

## Формы

- Формы — только на react-hook-form, без ручного `useState` под поля. Кастомные инпуты (например `InputOTP`) подключаем через `Controller`.
- Валидация — только zod-схемы через `zodResolver` из `@hookform/resolvers/zod`. Самописные правила для `register()` не пишем.
- Схемы и типы значений (`z.infer`) лежат в `src/entities/<entity>/model/schemas.ts`, наружу — через `index.ts` сущности.
- `trim` и прочую нормализацию делаем в схеме, а не в submit.
