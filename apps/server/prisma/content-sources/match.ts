import * as fs from 'fs';
import * as path from 'path';

import type { SourceRecord } from './types';

const STOP = new Set(['the', 'a', 'of', 'and', 'with', 'on', 'in', 'to', 'jpg', 'png', 'file']);

const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
    // stretches → stretch, poses → pose: имена файлов пишут по-разному
    .map((t) => t.replace(/(es|s)$/, ''));

/**
 * Строгое совпадение для текстов: слова запроса есть в названии записи и наоборот.
 * «Hanging Leg Raises» на запрос «hanging» не пройдёт — лишние слова в названии снижают счёт.
 */
export function strictScore(query: string, record: SourceRecord): number {
  const wanted = new Set(tokens(query));
  const names = [record.name, ...record.altNames].map((n) => new Set(tokens(n)));
  let best = 0;
  for (const name of names) {
    if (!name.size || !wanted.size) continue;
    const common = [...wanted].filter((t) => name.has(t)).length;
    best = Math.max(best, Math.min(common / wanted.size, common / name.size));
  }
  return best;
}

/** Доля слов запроса, найденных в названии записи: 1 — все слова на месте. */
export function matchScore(query: string, record: SourceRecord): number {
  const wanted = [...new Set(tokens(query))];
  if (!wanted.length) return 0;
  const name = new Set(tokens(record.name));
  const alt = new Set(record.altNames.flatMap(tokens));
  // В названии слово весит больше, чем в описании или категории
  const hits = wanted.reduce(
    (sum, t) => sum + (name.has(t) ? 1 : alt.has(t) ? 0.5 : 0),
    0,
  );
  return hits / wanted.length;
}

/** Лучшие записи по любому из запросов, не ниже minScore. */
export function bestMatches(
  queries: string[],
  records: SourceRecord[],
  { top = 3, minScore = 0.5, needImages = false, strict = false } = {},
) {
  const score = strict ? strictScore : matchScore;
  return records
    .filter((r) => !needImages || r.images.length)
    .map((record) => ({
      record,
      score: Math.max(0, ...queries.map((q) => score(q, record))),
    }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

/** Английское название из ссылки free-exercise-db: …/exercises/Side_Neck_Stretch/0.jpg */
export const nameFromImageUrl = (url: unknown): string | null => {
  const match = /\/exercises\/([^/]+)\/\d+\.\w+$/.exec(String(url ?? ''));
  return match ? match[1].replace(/_/g, ' ') : null;
};

/** Английские названия растяжки для поиска: словарь stretch-aliases.json + название из ссылки на фото. */
export function stretchQueries(code: string | null, image: unknown): string[] {
  const aliases = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '..', 'content', 'stretch-aliases.json'),
      'utf-8',
    ),
  ) as Record<string, string[]>;
  return [
    ...(code ? aliases[code] ?? [] : []),
    nameFromImageUrl(image),
  ].filter((q): q is string => !!q);
}
