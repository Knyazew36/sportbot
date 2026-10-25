import { type CatalogListItem, EQUIPMENT_LABEL, MUSCLE_GROUPS } from '@sportbot/api/entities/catalog';

/** Подпись строки: мышцы, инвентарь, время удержания растяжки */
export const catalogMeta = (item: CatalogListItem) =>
  [item.muscles, item.equipment && EQUIPMENT_LABEL[item.equipment], item.holdSeconds != null && `${item.holdSeconds} с`]
    .filter(Boolean)
    .join(' · ');

/** Подпись чипа: одна группа целиком — её название, одна мышца — её, иначе счётчик */
export const musclesLabel = (codes: readonly string[], names: Record<string, string>) => {
  if (codes.length === 0) return 'Мышцы';
  const group = MUSCLE_GROUPS.find((g) => g.codes.length === codes.length && g.codes.every((c) => codes.includes(c)));
  if (group) return group.label;
  if (codes.length === 1) return names[codes[0]!] ?? 'Мышцы · 1';
  return `Мышцы · ${codes.length}`;
};
