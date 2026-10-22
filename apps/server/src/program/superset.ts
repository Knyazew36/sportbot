export type SupersetSlot = { id: number; superset: number | null };

/** Буква суперсета: A, B… — номера в комплексе всегда идут 1..n сверху вниз. */
export const supersetLetter = (superset: number): string =>
  String.fromCharCode(64 + superset);

/** Пометка участника суперсета перед названием в тексте бота: «🔗A ». */
export const supersetMark = (superset: number | null): string =>
  superset === null ? '' : `🔗${supersetLetter(superset)} `;

/** Подряд идущие упражнения с одним номером суперсета; одиночное — отдельным блоком. */
export const supersetRuns = <T extends { superset: number | null }>(
  items: T[],
) => {
  const result: { superset: number | null; items: T[] }[] = [];
  for (const item of items) {
    const last = result.at(-1);
    if (last && item.superset !== null && last.superset === item.superset)
      last.items.push(item);
    else result.push({ superset: item.superset, items: [item] });
  }
  return result;
};

/**
 * Суперсеты после правки порядка или состава: у номера остаётся самый длинный непрерывный
 * отрезок, отставшие и оставшиеся в одиночку выходят из группы, номера идут 1..n сверху вниз.
 * Так перетаскивание мимо границы блока просто выводит упражнение из суперсета.
 */
export function normalizeSupersets(items: SupersetSlot[]): SupersetSlot[] {
  const blocks = supersetRuns(items);
  const longest = new Map<number, (typeof blocks)[number]>();
  for (const block of blocks) {
    if (block.superset === null) continue;
    const best = longest.get(block.superset);
    if (!best || block.items.length > best.items.length)
      longest.set(block.superset, block);
  }
  let next = 0;
  return blocks.flatMap((block) => {
    const kept =
      block.superset !== null &&
      block.items.length > 1 &&
      longest.get(block.superset) === block;
    const superset = kept ? ++next : null;
    return block.items.map((item) => ({ id: item.id, superset }));
  });
}

/** Суперсеты из файла импорта: не чиним молча, а возвращаем текст ошибки. */
export function supersetError(
  items: { superset?: number | null }[],
): string | null {
  const blocks = supersetRuns(
    items.map((item) => ({ superset: item.superset ?? null })),
  ).filter((block) => block.superset !== null);
  // Сначала разрыв: у разорванного суперсета куски часто по одному, и «нужно два» сбивало бы с толку
  const seen = new Set<number | null>();
  for (const block of blocks) {
    if (seen.has(block.superset))
      return `упражнения суперсета ${block.superset} должны идти подряд`;
    seen.add(block.superset);
  }
  const single = blocks.find((block) => block.items.length < 2);
  if (single)
    return `в суперсете ${single.superset} нужно хотя бы два упражнения`;
  return null;
}
