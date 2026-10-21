import type { ImageCredit, SourceRecord } from './types';

const API = 'https://wger.de/api/v2/exerciseinfo/';
const ENGLISH = 2;
const PAGE = 100;
const LICENSES = 'https://wger.de/api/v2/license/';

interface WgerExercise {
  id: number;
  uuid: string;
  images: {
    image: string;
    is_main: boolean;
    license: number;
    license_author: string;
    is_ai_generated: boolean;
  }[];
  translations: { language: number; name: string; description: string }[];
}

/** HTML описания wger → абзацы и пункты списков простым текстом. */
const paragraphs = (html: string): string[] =>
  html
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** wger: все упражнения с английским описанием; названия на других языках — для подбора пары. */
export async function fetchWger(): Promise<SourceRecord[]> {
  const licenseName = new Map(
    (
      (await (
        await fetch(LICENSES, { signal: AbortSignal.timeout(60_000) })
      ).json()) as { results: { id: number; short_name: string }[] }
    ).results.map((l) => [l.id, l.short_name]),
  );
  const records: SourceRecord[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const response = await fetch(`${API}?limit=${PAGE}&offset=${offset}`, {
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`wger не ответил: ${response.status}`);
    const page = (await response.json()) as {
      next: string | null;
      results: WgerExercise[];
    };
    for (const item of page.results) {
      const english = item.translations.find((t) => t.language === ENGLISH);
      const instructions = english ? paragraphs(english.description) : [];
      if (!english || !instructions.length) continue;
      const url = `https://wger.de/exercise/${item.id}/view-base`;
      // Сгенерированные картинки не берём: в справочнике только настоящие фото
      const photos = item.images
        .filter((image) => !image.is_ai_generated)
        .sort((a, b) => Number(b.is_main) - Number(a.is_main));
      const images = photos.map((image) => image.image);
      const imageCredits: ImageCredit[] = photos.map((image) => ({
        license: licenseName.get(image.license) ?? `wger license #${image.license}`,
        author: image.license_author?.trim() || null,
        page: url,
      }));
      records.push({
        source: 'wger',
        sourceId: String(item.id),
        url,
        name: english.name.trim(),
        altNames: item.translations
          .filter((t) => t.language !== ENGLISH)
          .map((t) => t.name.trim()),
        instructions,
        images,
        imageCredits,
      });
    }
    if (!page.next) break;
  }
  return records;
}
