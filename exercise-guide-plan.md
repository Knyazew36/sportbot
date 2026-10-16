# Понятная техника упражнений: экспорт → обогащение → применение

## Context
Техника сейчас — 1–2 строки в `Exercise.technique` (фронт режет regex'ом `splitTechnique` в `apps/frontend/src/entities/catalog/lib.ts:37` на пункты + «Ошибки:»), одно фото. Новичку мало. На проде пользователи/админ уже правили записи (модерация, жалобы с proposal, админ CRUD) — локальный `prisma/content/catalog.json` устарел, затирать прод им нельзя.

Решения пользователя:
- Техника — структура: новое поле `guide Json?`, старое `technique` остаётся запасным (черновики, старые записи).
- Тексты пишет скрипт через Claude API (локально, ключ только на машине разработчика).
- Второе фото (финиш) из free-exercise-db.
- Экспорт/применение — скриптами по SSH, с защитой от затирания свежих правок по `updatedAt`.

**Тексты не выдумываем.** Каждое описание опирается на найденный источник с лицензией; LLM только переводит и адаптирует для новичка (структура, «ты», короткие фразы) и не добавляет фактов, которых нет в источнике или в текущем тексте записи. Источник и лицензия хранятся вместе с guide и показываются в UI («Источник: …»). Этот же слой источников потом используем для программ.

Источники (по приоритету):
1. **free-exercise-db** (Unlicense, без условий) — EN `instructions[]`, фото старт/финиш. Основной.
2. **wger** (REST API, данные CC-BY-SA, лицензия и автор у каждой записи свои) — для записей без пары в п.1. Условие: указать автора/лицензию, наш перевод этого текста тоже CC-BY-SA. Подходит, раз показываем источник.
3. Не берём: MuscleWiki, ExRx, гифки ExerciseDB, RepDB (копирайт, запрет ToS или запрет распространения). Запись без источника → в ревью «нет источника», guide не пишем, остаётся старая `technique`.

Сопоставление с free-exercise-db (Unlicense) — все 219 упражнений и 110 из 124 растяжек уже берут оттуда `…/exercises/<Folder>/0.jpg`. По `<Folder>` находим запись в `dist/exercises.json`: EN `instructions[]`, `1.jpg` (финиш). Записи без пары (растяжки без фото, одобренные черновики с `code = null`) — генерация только по названию + текущему тексту, с пометкой «без источника» в ревью.

## Принцип
```
источники (адаптеры) ──▶ prisma/content/sources/<source>.json (снимок: id, url, license, author, EN-текст, фото)
сервер: content:export ──scp──▶ локально: content:enrich (сопоставление + Claude Batch API)
        ▲                                   │ guides.json + review.md
        └──scp── content:apply-guides ◀── ручное ревью/правка JSON
```
Применение — точечно по `id`, только поля `guide` и `imageEndPath`, `updateMany({ where: { id, updatedAt: exportedAt } })`: запись, изменённая после экспорта, пропускается и попадает в отчёт. Мышцы, название, фото, `technique` не трогаем.

## 1. Схема — `apps/server/prisma/schema.prisma`
- `Exercise.guide Json?` — `{ summary, setup[], steps[], breathing, mistakes[{ mistake, fix }], tips[], safety?, source: { name, url, license, author? } }`.
- `Exercise.imageEndPath String?` — финишное положение, только для Mini App (кэши мессенджеров не нужны).
- `Stretch.guide Json?` — `{ summary, setup[], steps[], feel, mistakes[{ mistake, fix }] }`; `Stretch.imageEndPath String?`.
- Миграция `add_catalog_guide`. Тип и zod-подобная проверка формы guide — общий модуль `src/catalog/catalog-guide.ts` (тип + функция валидации, используется импортом, apply и DTO).

## 2. Скрипты — `apps/server/prisma/` (рядом с `import-content.ts`, тот же стиль запуска)
- `export-content.ts` → `content:export [out.json]`: все `status: CATALOG` упражнения и растяжки: `id, code, updatedAt, name, technique|howTo, guide, imagePath, imageEndPath, equipment, muscles(code, role), joints, holdSeconds, perSide`. Плюс подсказка в выводе: `tar czf catalog-uploads.tgz uploads/catalog` для бэкапа картинок.
- `content-sources/` — адаптеры источников, общий формат `SourceRecord { source, sourceId, url, license, author?, name, instructions[], images[] }`:
  - `free-exercise-db.ts` — `dist/exercises.json` с GitHub;
  - `wger.ts` — публичный API (`/api/v2/exerciseinfo/`, EN-переводы + license/author);
  - `content:sources` → снимки в `prisma/content/sources/*.json` (в git: воспроизводимо, видно, откуда факт). Потом сюда же — адаптеры программ.
- `enrich-content.ts` → `content:enrich <export.json>` (только локально, `ANTHROPIC_API_KEY` из env, не в `.env.example` сервера):
  - читает снимки источников; для wger — подбор по EN-названию + инвентарю, пара уходит в ревью с флагом «проверить»;
  - сопоставление: `code` → `image` из `prisma/content/catalog.json` → folder → запись EN; если название в экспорте сильно ушло от catalog.json — флаг «проверить пару»;
  - промпт: RU-название, текущий текст (может содержать правки людей — сохранить их факты), EN-инструкции источника, мышцы, инвентарь; жёсткое правило — только факты из источника и текущего текста, нет данных для поля → пустой массив, а не догадка; стиль: «ты», коротко, для новичка, без медицинских обещаний, слово «очередь», не «ротация»;
  - Message Batches API + structured output по JSON-схеме guide, модель `claude-opus-5-5` (перед написанием загрузить skill `claude-api` для точных параметров);
  - выход: `guides.json` (`{ exercises: [{ id, updatedAt, guide, imageEnd? }], stretches: [...] }`, `imageEnd` = URL `1.jpg`) и `review.md` (по записи: было / стало / источник / флаги).
  - SDK `@anthropic-ai/sdk` — в `devDependencies` сервера.
- `apply-guides.ts` → `content:apply-guides <guides.json> [--dry-run]`: валидирует каждый guide, качает `imageEnd` через `resolveCatalogImage` (`src/catalog/catalog-image.ts:23`) до транзакции (как `import.service.ts:381`), пишет `updateMany` по `id + updatedAt`; отчёт: обновлено / пропущено (изменено после экспорта) / ошибки. Логи — Nest `Logger` с эмодзи домена каталога.
- `import.service.ts` (`check` + `apply`): принимать необязательные `guide` и `imageEnd` у упражнений и растяжек, чтобы чистая установка через `content.sh` сразу была с новой техникой. После прогона — обновить `prisma/content/catalog.json` экспортом guide/imageEnd по code.

## 3. Сервер — API
- `src/catalog/dto/catalog-exercise.response.dto.ts` (+ stretch): `guide: ExerciseGuideDto | null`, `imageEndUrl: string | null`; DTO-классы guide — по одному на файл (`exercise-guide.dto.ts`, `guide-mistake.dto.ts`, `stretch-guide.dto.ts`), в `@Swagger` ответа.
- Маппинг в `catalog.service.ts` / `catalog-app.service.ts` — `select` guide и imageEndPath в тех же запросах.
- Админ: `admin-catalog.service.ts` + update/create DTO принимают `guide` (class-validator, вложенные DTO) и картинку финиша (тот же `image` upload, параметр `kind=end`).
- Бот: `catalog.texts.ts:32` `exerciseCard` — если есть guide, шаги из `guide.steps`, иначе `technique`.

## 4. Фронт (после `api:generate` пользователем)
- `src/entities/catalog/lib.ts`: `exerciseGuide(e)` — guide, либо фолбэк из `splitTechnique` в ту же форму (steps = points, mistakes без fix).
- `src/pages/library/ExercisePage.tsx` → блоки в `src/pages/library/components/`: `GuidePhotos` (старт → финиш), `GuideSteps` (исходное положение, выполнение — нумерованные), `GuideBreathing`, `GuideMistakes` (ошибка → как исправить), `GuideTips`. Только `shared/ui`, тексты через `kit/Typography`, без бейджей.
- Подпись источника внизу страницы: «Источник: free-exercise-db» / «wger.de, автор, CC-BY-SA» — ссылкой.
- `src/widgets/exercise-sheet/ExerciseSheet.tsx` (во время тренировки): компактно — фото-пара, шаги, ошибки.
- `StretchPage.tsx`, `CooldownPage.tsx`: то же для растяжек (`splitSteps` как фолбэк).
- Админ `pages/admin/components/ExerciseForm.tsx` / `StretchForm.tsx`: редактор guide на `useFieldArray`, схема в `src/entities/catalog/model/schemas.ts`.

## 5. Порядок работ
1. Схема + миграция, `catalog-guide.ts`, DTO, сервис → пользователь: migrate deploy, сервер, `api:generate`.
2. Адаптеры + `content:sources`, снимки в git. `content:export`, прогон на сервере, scp.
3. `content:enrich` локально на 5 записях → ревью стиля → весь каталог.
4. Ревью `review.md`, правки в `guides.json`.
5. Фронт-блоки (можно параллельно с 3–4, фолбэк на technique).
6. `content:apply-guides --dry-run` → реальный прогон на сервере. Обновить `catalog.json`.

## Проверка
- `tsc` сервера (`yarn check-types`) и фронта (`tsc -p tsconfig.app.json`); prettier не запускать.
- `content:export` локально против dev-БД: число записей = CATALOG в БД.
- `content:enrich` на 5 записях: валидный JSON по схеме, `review.md` читаем.
- `content:apply-guides --dry-run`, затем изменить одну запись через админку → реальный прогон: она в «пропущено», остальные обновлены, финиш-фото в `uploads/catalog`.
- Mini App: страница упражнения с guide и без (фолбэк), шторка в тренировке, растяжка; ширина 375.

## 6. Программы (следующий этап, после справочника)
Принцип тот же: схему берём из публичного источника, тексты не выдумываем и не копируем. Схема программы (дни, упражнения, подходы×повторы, правило прогрессии) — факт; авторские тексты, книги и таблицы не копируем. Описание пишем своё, автора и ссылку указываем.

Источники:
1. Вики r/Fitness, раздел Recommended Routines: Basic Beginner Routine, GZCLP, Greyskull LP, PPL от Metallicadpa, PHUL, 5/3/1 for Beginners. Стартовый набор для новичков.
2. Классика с автором: StrongLifts 5×5, Starting Strength, 5/3/1 Wendler. Только схема и ссылка на автора.
3. wger: публичные шаблоны программ (CC-BY-SA). Наличие и качество проверить.
4. Нормы ACSM / NSCA / ВОЗ (объём на мышцу в неделю, частота, отдых). Не программы, а проверка: и наших, и пользовательских.

Реализация:
- Адаптер `content-sources/programs/` → снимки `prisma/content/sources/programs/*.json` (`source, url, author, license`, схема).
- Упражнения программы сопоставляются со справочником по `code`; нет в справочнике → отчёт «нет в справочнике». Поэтому программы идут после справочника.
- LLM только переносит схему источника в формат `catalog.json → programs` и пишет «кому подходит» по источнику. Подходы и повторы не придумывает. Дальше ревью, затем импорт через `content:import`.
- Старт: 5–7 программ для новичков из п.1.
