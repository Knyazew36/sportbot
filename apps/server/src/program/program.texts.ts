import { btn, grid, plural } from '@/bot';
import { MessengerButton } from '@/messengers';

/** «4 × 8–12» / «3 × 10». */
export function planText(
  sets: number,
  repsMin: number,
  repsMax: number,
): string {
  return `${sets} × ${repsMin === repsMax ? repsMin : `${repsMin}–${repsMax}`}`;
}

/** «🏃 Кардио: беговая дорожка — 30 мин»; кардио в комплексе нет — null. */
export function cardioText(source: {
  cardioName: string | null;
  cardioMinutes: number | null;
}): string | null {
  if (!source.cardioName || !source.cardioMinutes) return null;
  return `🏃 Кардио: ${source.cardioName} — ${source.cardioMinutes} мин`;
}

export const exercisesCount = (n: number): string =>
  `${n} ${plural(n, 'упражнение', 'упражнения', 'упражнений')}`;

export const complexesCount = (n: number): string =>
  `${n} ${plural(n, 'комплекс', 'комплекса', 'комплексов')}`;

type TaggedTemplate = {
  tags: { id: number; name: string; position: number }[];
};

/** Теги, которые есть хотя бы у одного шаблона, по порядку чипов: пустой тег не даст пустой список. */
export function templateTags<T extends TaggedTemplate>(templates: T[]) {
  const tags = new Map<number, T['tags'][number]>();
  for (const t of templates) for (const tag of t.tags) tags.set(tag.id, tag);
  return [...tags.values()].sort((a, b) => a.position - b.position);
}

/** Шаблоны под выбранным чипом; 0 — «Все». */
export const byTag = <T extends TaggedTemplate>(
  templates: T[],
  tagId: number,
) =>
  tagId
    ? templates.filter((t) => t.tags.some((tag) => tag.id === tagId))
    : templates;

/** Ряд кнопок-чипов над шаблонами: «Все» и теги, активный помечен точкой. */
export function tagButtons<T extends TaggedTemplate>(
  templates: T[],
  activeTagId: number,
  callback: (tagId: number) => string,
): MessengerButton[][] {
  const tags = templateTags(templates);
  if (!tags.length) return [];
  const mark = (name: string, id: number) =>
    id === activeTagId ? `• ${name}` : name;
  return grid(
    [
      btn(mark('Все', 0), callback(0)),
      ...tags.map((tag) => btn(mark(tag.name, tag.id), callback(tag.id))),
    ],
    3,
  );
}
