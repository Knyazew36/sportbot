import { supersetLetter } from '@/program/superset';

/** Минимум упражнения тренировки, по которому идёт круг суперсета. */
export interface RoundItem {
  id: number;
  superset: number | null;
  plannedSets: number;
  done: boolean;
  sets: unknown[];
}

export interface RoundInfo {
  /** Буква суперсета: A, B… — номера в комплексе идут 1..n. */
  letter: string;
  /** Место упражнения в суперсете, с 1. */
  index: number;
  size: number;
  /** Круг, который сейчас делается, с 1. */
  round: number;
  rounds: number;
  /** Следующее упражнение круга; null — дальше снова это же или суперсет закончен. */
  nextId: number | null;
}

const hasLeft = (item: RoundItem): boolean =>
  item.sets.length < item.plannedSets;

const isStarted = (item: RoundItem): boolean =>
  item.done || item.sets.length > 0;

const membersOf = <T extends RoundItem>(items: T[], item: T): T[] =>
  item.superset === null
    ? [item]
    : items.filter((e) => e.superset === item.superset);

/** Следующий по кругу участник с оставшимися подходами, не считая текущего. */
const nextMember = <T extends RoundItem>(
  members: T[],
  item: T,
): { next: T; wrapped: boolean } | null => {
  const index = members.indexOf(item);
  for (let step = 1; step < members.length; step++) {
    const next = members[(index + step) % members.length];
    if (hasLeft(next))
      return { next, wrapped: index + step >= members.length };
  }
  return null;
};

/**
 * Куда идти после записанного подхода. В суперсете — к следующему участнику без отдыха,
 * отдых только когда круг замкнулся. Одиночное упражнение остаётся на месте с отдыхом, как раньше.
 */
export function afterSet<T extends RoundItem>(
  items: T[],
  itemId: number,
): { nextId: number; rest: boolean } {
  const item = items.find((e) => e.id === itemId);
  if (!item || item.superset === null) return { nextId: itemId, rest: true };
  const members = membersOf(items, item);
  const found = nextMember(members, item);
  if (found) return { nextId: found.next.id, rest: found.wrapped };
  if (hasLeft(item)) return { nextId: itemId, rest: true };
  // Суперсет закончен — следующий несделанный блок, иначе остаёмся
  const after = items.indexOf(members.at(-1)!);
  const next =
    items.find((e, i) => i > after && !isStarted(e)) ??
    items.find((e) => !isStarted(e));
  return { nextId: next?.id ?? itemId, rest: true };
}

/**
 * Текущее упражнение без явного выбора: первое несделанное, но начатый суперсет
 * с оставшимися подходами держит круг — иначе после первого подхода у всех его бы пропустило.
 */
export function currentItem<T extends RoundItem>(items: T[]): T | undefined {
  for (const item of items) {
    if (item.superset === null) {
      if (!isStarted(item)) return item;
      continue;
    }
    const members = membersOf(items, item);
    // Суперсет проверяем один раз — на первом участнике
    if (members[0] !== item) continue;
    const left = members.filter(hasLeft);
    if (left.length && members.some((e) => e.sets.length > 0))
      return left.reduce((min, e) =>
        e.sets.length < min.sets.length ? e : min,
      );
    const fresh = members.find((e) => !isStarted(e));
    if (fresh) return fresh;
  }
  return items.at(-1);
}

/** Подпись круга для экрана упражнения; null — упражнение не в суперсете. */
export function roundInfo<T extends RoundItem>(
  items: T[],
  itemId: number,
): RoundInfo | null {
  const item = items.find((e) => e.id === itemId);
  if (!item || item.superset === null) return null;
  const members = membersOf(items, item);
  const rounds = Math.max(...members.map((e) => e.plannedSets));
  return {
    letter: supersetLetter(item.superset),
    index: members.indexOf(item) + 1,
    size: members.length,
    round: Math.min(item.sets.length + 1, Math.max(rounds, 1)),
    rounds,
    nextId: nextMember(members, item)?.next.id ?? null,
  };
}
