import type { SourceRecord } from './types';

const DATA =
  'https://raw.githubusercontent.com/RepDB/exercise-dataset/main/exercises.json';
const SITE = 'https://exercise-dataset.com/exercise';

interface RepdbExercise {
  id: string;
  name_en: string;
  name_de?: string;
  name_es?: string;
  category: string;
  description_en?: string;
  instructions_en?: string[];
  tips_en?: string[];
}

/**
 * RepDB, бесплатный уровень: только тексты растяжек как источник фактов (описание, шаги, подсказки).
 * Картинки не берём — это иллюстрации, а в справочнике только фото.
 * Лицензия требует подписи «Exercise data by RepDB» и запрещает выкладывать датасет:
 * снимок в .gitignore, в базу идут только пересказ и ссылка на страницу.
 */
export async function fetchRepdb(): Promise<SourceRecord[]> {
  const response = await fetch(DATA, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`RepDB не ответил: ${response.status}`);
  const data = (await response.json()) as { exercises: RepdbExercise[] };
  return data.exercises
    .filter((item) => item.category === 'stretching')
    .map((item) => ({
      source: 'repdb',
      sourceId: item.id,
      url: `${SITE}/${item.id}/`,
      name: item.name_en.trim(),
      altNames: [item.name_de, item.name_es].filter(
        (name): name is string => !!name,
      ),
      instructions: [
        ...(item.description_en ? [item.description_en] : []),
        ...(item.instructions_en ?? []),
        ...(item.tips_en ?? []).map((tip) => `Tip: ${tip}`),
      ],
      images: [],
    }));
}
