# Понятная техника упражнений: экспорт → обогащение → применение

## Context
Техника сейчас — 1–2 строки в `Exercise.technique` (фронт режет regex'ом `splitTechnique` в `apps/frontend/src/entities/catalog/lib.ts:37` на пункты + «Ошибки:»), одно фото. Новичку мало. На проде пользователи/админ уже правили записи (модерация, жалобы с proposal, админ CRUD) — локальный `prisma/content/catalog.json` устарел, затирать прод им нельзя.

Решения пользователя:
- Техника — три простых поля, которые заполняют и пользователи, и админ, и скрипт:
  - `technique` (у растяжки — `howTo`) остаётся и становится **общим описанием** свободным текстом;
  - `steps String[]` — шаги, в форме «+ Добавить шаг»;
  - `mistakes String[]` — ошибки, в форме «+ Добавить ошибку»; ошибка пишется сразу с исправлением одной строкой: «Колени внутрь — разводи по линии носков».
- Парсер не нужен: каждый пункт вводится отдельно.
- Тексты пишет скрипт через Claude API (локально, ключ только на машине разработчика).
- Второе фото (финиш) из free-exercise-db.
- Экспорт/применение — скриптами по SSH, с защитой от затирания свежих правок по `updatedAt`.

**Тексты не выдумываем.** Каждое описание опирается на найденный источник; LLM только переводит и адаптирует для новичка («ты», короткие фразы) и не добавляет фактов, которых нет в источнике или в текущем тексте записи. При конфликте выигрывает текущий текст (в нём могут быть правки людей). Этот же слой источников потом используем для программ.

Источники (по приоритету):
1. **free-exercise-db** — EN `instructions[]`, фото старт/финиш. Основной.
2. **wger** (REST API) — для записей без пары в п.1.
3. **MuscleWiki, ExRx, ExerciseDB, RepDB** — подключаем, если дают пользу для записей без пары (тексты техники, фото/гифки). Покрытие проверить на шаге 2.

Запись без источника → в ревью «нет источника», не трогаем, остаётся текущий текст.

Сопоставление с free-exercise-db — все 219 упражнений и 110 из 124 растяжек уже берут оттуда `…/exercises/<Folder>/0.jpg`. По `<Folder>` находим запись в `dist/exercises.json`: EN `instructions[]`, `1.jpg` (финиш). Записи без пары (растяжки без фото, одобренные черновики с `code = null`) — ищем в других источниках, иначе «нет источника».

## Принцип
```
источники (адаптеры) ──▶ prisma/content/sources/<source>.json (снимок: id, url, EN-текст, фото)
сервер: content:export ──scp──▶ локально: content:enrich (сопоставление + Claude Batch API)
        ▲                                   │ guides.json + review.md
        └──scp── content:apply-guides ◀── ручное ревью/правка JSON
```
Применение — точечно по `id`, только поля `technique|howTo`, `steps`, `mistakes`, `imageEndPath`, `updateMany({ where: { id, updatedAt: exportedAt } })`: запись, изменённая после экспорта, пропускается и попадает в отчёт. Мышцы, название, фото не трогаем.

`technique` перезаписывается новым описанием, поэтому промпт обязан сохранить факты текущего текста, а `review.md` показывает было / стало.

## 1. Схема — `apps/server/prisma/schema.prisma`
- `Exercise.steps String[] @default([])`, `Exercise.mistakes String[] @default([])`.
- `Exercise.imageEndPath String?` — финишное положение, только для Mini App (кэши мессенджеров не нужны).
- То же у `Stretch`: `steps`, `mistakes`, `imageEndPath`.
- Миграция `add_catalog_steps`.

## 2. Скрипты — `apps/server/prisma/` (рядом с `import-content.ts`, тот же стиль запуска)
- `export-content.ts` → `content:export [out.json]`: все `status: CATALOG` упражнения и растяжки: `id, code, updatedAt, name, technique|howTo, steps, mistakes, imagePath, imageEndPath, equipment, muscles(code, role), joints, holdSeconds, perSide`. Плюс подсказка в выводе: `tar czf catalog-uploads.tgz uploads/catalog` для бэкапа картинок.
- `content-sources/` — адаптеры источников, общий формат `SourceRecord { source, sourceId, url, name, instructions[], images[] }`:
  - `free-exercise-db.ts` — `dist/exercises.json` с GitHub;
  - `wger.ts` — публичный API (`/api/v2/exerciseinfo/`, EN-переводы);
  - по пользе — `musclewiki.ts`, `exrx.ts`, `exercisedb.ts`, `repdb.ts`;
  - `content:sources` → снимки в `prisma/content/sources/*.json` (в git: воспроизводимо, видно, откуда факт). Потом сюда же — адаптеры программ.
- `enrich-content.ts` → `content:enrich <export.json> [--limit N]` (только локально, `ANTHROPIC_API_KEY` из env, не в `.env.example` сервера):
  - читает снимки источников; для записей без пары в free-exercise-db — подбор по EN-названию + инвентарю, пара уходит в ревью с флагом «проверить»;
  - сопоставление: `code` → `image` из `prisma/content/catalog.json` → folder → запись EN; если название в экспорте сильно ушло от catalog.json — флаг «проверить пару»;
  - промпт: RU-название, текущий текст (может содержать правки людей — сохранить их факты), EN-инструкции источника, мышцы, инвентарь; жёсткое правило — только факты из источника и текущего текста, нет данных — пустой массив, а не догадка; исправление ошибки — из текста, не придумано; стиль: «ты», коротко, для новичка, без медицинских обещаний, слово «очередь», не «ротация»;
  - Message Batches API + structured output `{ description, steps[], mistakes[] }`, модель `claude-opus-5-5` (перед написанием загрузить skill `claude-api` для точных параметров);
  - выход: `guides.json` (`{ exercises: [{ id, updatedAt, description, steps, mistakes, imageEnd? }], stretches: [...] }`, `imageEnd` = URL `1.jpg`) и `review.md` (по записи: было / стало / источник / флаги).
  - SDK `@anthropic-ai/sdk` — в `devDependencies` сервера.
- `apply-guides.ts` → `content:apply-guides <guides.json> [--dry-run]`: валидирует каждую запись (строки не пустые, лимиты длины и числа пунктов), качает `imageEnd` через `resolveCatalogImage` (`src/catalog/catalog-image.ts:23`) до транзакции (как `import.service.ts:381`), пишет `updateMany` по `id + updatedAt`; отчёт: обновлено / пропущено (изменено после экспорта) / ошибки. Логи — Nest `Logger` с эмодзи домена каталога.
- `import.service.ts` (`check` + `apply`): принимать необязательные `steps`, `mistakes`, `imageEnd` у упражнений и растяжек, чтобы чистая установка через `content.sh` сразу была с новой техникой. После прогона — обновить `prisma/content/catalog.json` экспортом по code.

## 3. Сервер — API
- Response DTO каталога, админки и тренировки (`catalog-exercise.response.dto.ts` + stretch, `admin-exercise/stretch.response.dto.ts`, `workout-item.response.dto.ts`, `cooldown-stretch.response.dto.ts`): `steps: string[]`, `mistakes: string[]`, `imageEndUrl: string | null`.
- Маппинг в `catalog.service.ts` / `catalog-app.service.ts` / `workout-app.service.ts` — поля в тех же `select`.
- Create/update DTO — админ (`save-exercise.dto.ts`, `save-stretch.dto.ts`), черновики (`create-draft.dto.ts`), предложения правок (`create-exercise-proposal.dto.ts`, `create-stretch-proposal.dto.ts`): `@IsArray() @IsString({ each: true })` + `@ArrayMaxSize` / `@MaxLength`.
- `catalog-proposal.ts`: новые поля в дифф правки, вид `kind: 'list'` рядом с `'text'` (было / стало списком). Модерация и применение правки (`moderation.service.ts`, `draft-app.service.ts`, `admin-app.service.ts`) переносят поля.
- Админ: картинка финиша — тот же `image` upload, параметр `kind=end`.
- Бот: `catalog.texts.ts` `exerciseCard` — описание + нумерованные шаги + ошибки; пустые `steps` → как сейчас.

## 4. Фронт (после `api:generate` пользователем)
- `src/widgets/catalog/ExerciseFields.tsx`, `StretchFields.tsx` — общие для создания, правки пользователем и админки: textarea «Описание» (подсказку про «Ошибки: …» убрать) + два списка «Шаги» и «Ошибки» на `useFieldArray`, у каждого «+ Добавить» и удаление. Общий компонент списка строк — в `src/widgets/catalog/`.
- Схемы `src/entities/catalog/model/schemas.ts`: `steps`, `mistakes` — `z.array(z.string().trim())` с отбрасыванием пустых, лимиты.
- `src/pages/library/ExercisePage.tsx` → блоки в `src/pages/library/components/`: `GuidePhotos` (старт → финиш), описание, `GuideSteps` (нумерованные), `GuideMistakes`. Пустые `steps`/`mistakes` → старый `splitTechnique`. Только `shared/ui`, тексты через `kit/Typography`, без бейджей.
- `src/widgets/exercise-sheet/ExerciseSheet.tsx` (во время тренировки): компактно — фото-пара, шаги, ошибки.
- `StretchPage.tsx`, `CooldownPage.tsx`: то же для растяжек (`splitSteps` как фолбэк).

## 5. Порядок работ
1. Схема + миграция, DTO, сервисы, дифф правок → пользователь: migrate deploy, сервер, `api:generate`.
2. Адаптеры + `content:sources`, снимки в git; проверить покрытие доп. источников. `content:export`, прогон на сервере, scp.
3. `content:enrich --limit 10` → ревью стиля (ручной образец на 10 грудных уже согласован) → весь каталог.
4. Ревью `review.md`, правки в `guides.json`.
5. Фронт-блоки и формы (можно параллельно с 3–4, фолбэк на technique).
6. `content:apply-guides --dry-run` → реальный прогон на сервере. Обновить `catalog.json`.

## Проверка
- `tsc` сервера (`yarn check-types`) и фронта (`tsc -p tsconfig.app.json`); prettier не запускать.
- `content:export` локально против dev-БД: число записей = CATALOG в БД.
- `content:enrich --limit 10`: валидный JSON по схеме, `review.md` читаем.
- `content:apply-guides --dry-run`, затем изменить одну запись через админку → реальный прогон: она в «пропущено», остальные обновлены, финиш-фото в `uploads/catalog`.
- Пользователь создаёт черновик с шагами/ошибками → одобрение → поля на месте; предложение правки шага видно в диффе модерации.
- Mini App: страница упражнения с шагами и без (фолбэк), шторка в тренировке, растяжка, формы; ширина 375.

## 6. Программы (следующий этап, после справочника)
Принцип тот же: схему берём из публичного источника, тексты не выдумываем. Схема программы (дни, упражнения, подходы×повторы, правило прогрессии) — факт; описание пишем своё.

Источники:
1. Вики r/Fitness, раздел Recommended Routines: Basic Beginner Routine, GZCLP, Greyskull LP, PPL от Metallicadpa, PHUL, 5/3/1 for Beginners. Стартовый набор для новичков.
2. Классика: StrongLifts 5×5, Starting Strength, 5/3/1 Wendler.
3. wger: публичные шаблоны программ. Наличие и качество проверить.
4. Нормы ACSM / NSCA / ВОЗ (объём на мышцу в неделю, частота, отдых). Не программы, а проверка: и наших, и пользовательских.

Реализация:
- Адаптер `content-sources/programs/` → снимки `prisma/content/sources/programs/*.json` (`source, url`, схема).
- Упражнения программы сопоставляются со справочником по `code`; нет в справочнике → отчёт «нет в справочнике». Поэтому программы идут после справочника.
- LLM только переносит схему источника в формат `catalog.json → programs` и пишет «кому подходит» по источнику. Подходы и повторы не придумывает. Дальше ревью, затем импорт через `content:import`.
- Старт: 5–7 программ для новичков из п.1.
