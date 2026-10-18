---
name: brand
description: Фирменный стиль Спортбота — цвета, шрифты, логотип, движение. Использовать при создании видео, анимаций, постов для соцсетей, промо-страниц, иконок и любых визуальных материалов бренда.
---

# Фирменный стиль Спортбота

Источник правды — `packages/brand`. Перед работой прочитай:

1. `packages/brand/BRAND.md` — характер и правила.
2. `packages/brand/tokens.json` — точные значения.
3. `packages/brand/logo/` — знак. Используй готовые SVG, не перерисовывай.

## Правила

- Цвета и шрифты — только из токенов. Новый цвет не придумывай; нужен — сначала добавь в `tokens.json` и `BRAND.md`.
- Плоско: без размытых теней и градиентов. Углы квадратные.
- Один синий акцент на кадр.
- В видео подключай `@sportbot/brand/tokens.json`, а не копируй значения.
- Форматы видео — `video` в `tokens.json`.

## Видео

Шаблоны — `apps/video` (Remotion). Ролики — вставки в чужой монтаж, без звука.

- Превью и ручная настройка: `yarn workspace video studio`.
- Обычный ролик (MP4): `yarn workspace video render <Id> out/<имя>.mp4 --props='{...}'`.
- Оверлей с прозрачным фоном (ProRes 4444): `yarn workspace video render:overlay <Id> out/<имя>.mov --props='{..., "background":"transparent"}'`.
- Шаблоны и их props — `apps/video/src/Root.tsx`. Новый шаблон собираем из `components/` (`Card`, `Mark`, `Background`), цвета и easing — из `src/brand.ts`, не хардкодим.
- Текст держим выше нижних ~22% кадра и ниже верхних ~13% — там интерфейс Instagram.
