import type { SourceRecord } from './types';

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';

interface FreeExercise {
  id: string;
  name: string;
  instructions: string[];
  images: string[];
}

/** free-exercise-db: id записи — имя папки, из которой справочник уже берёт 0.jpg. */
export async function fetchFreeExerciseDb(): Promise<SourceRecord[]> {
  const response = await fetch(`${BASE}/dist/exercises.json`, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok)
    throw new Error(`free-exercise-db не скачался: ${response.status}`);
  const items = (await response.json()) as FreeExercise[];
  return items.map((item) => ({
    source: 'free-exercise-db',
    sourceId: item.id,
    url: `https://github.com/yuhonas/free-exercise-db/tree/main/exercises/${item.id}`,
    name: item.name,
    altNames: [],
    instructions: item.instructions.map((line) => line.trim()).filter(Boolean),
    images: item.images.map((image) => `${BASE}/exercises/${image}`),
  }));
}

/** Папка free-exercise-db из ссылки на картинку справочника: …/exercises/<Folder>/0.jpg. */
export function freeExerciseFolder(image: string | undefined): string | null {
  const match = image?.match(/free-exercise-db\/main\/exercises\/([^/]+)\//);
  return match ? match[1] : null;
}
