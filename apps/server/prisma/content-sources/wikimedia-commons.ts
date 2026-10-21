import type { SourceRecord } from './types';

const API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia требует User-Agent с контактом, иначе режет запросы
const USER_AGENT = 'sportbot-content/1.0 (https://github.com/Knyazew36/sportbot)';
/** Категории с фото растяжек; подкатегории обходим на DEPTH уровней вниз. */
const ROOTS = [
  'Category:Stretching',
  'Category:Stretching asanas',
  'Category:Stretching legs',
  'Category:People stretching',
  'Category:Stretching routines',
  'Category:Gymnastics flexibility training',
];
const DEPTH = 2;
/** Свободные лицензии без запрета коммерции и переделок: CC0, общественное достояние, CC BY, CC BY-SA. */
const FREE_LICENSE = /^(cc0|public domain|pd|cc[ -]by(-sa)?[ -][\d.]+)/i;
const PHOTO = /\.(jpe?g|png|webp)$/i;
const THUMB_WIDTH = 1024;

interface CommonsPage {
  pageid: number;
  title: string;
  imageinfo?: {
    thumburl?: string;
    url: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value: string } | undefined>;
  }[];
}

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

async function query(params: Record<string, string>) {
  const url = `${API}?${new URLSearchParams({ format: 'json', action: 'query', ...params })}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`Commons не ответил: ${response.status}`);
  return (await response.json()) as {
    continue?: Record<string, string>;
    query?: {
      categorymembers?: { title: string }[];
      pages?: Record<string, CommonsPage>;
    };
  };
}

/** Все подкатегории корней до DEPTH уровней. */
async function categories(): Promise<string[]> {
  const seen = new Set(ROOTS);
  let level = [...ROOTS];
  for (let depth = 0; depth < DEPTH; depth++) {
    const next: string[] = [];
    for (const title of level) {
      let cont: Record<string, string> = {};
      do {
        const page = await query({
          list: 'categorymembers',
          cmtitle: title,
          cmtype: 'subcat',
          cmlimit: '500',
          ...cont,
        });
        for (const member of page.query?.categorymembers ?? [])
          if (!seen.has(member.title)) {
            seen.add(member.title);
            next.push(member.title);
          }
        cont = page.continue ?? {};
      } while (Object.keys(cont).length);
    }
    level = next;
  }
  return [...seen];
}

/**
 * Wikimedia Commons: фото из категорий о растяжке, только под свободной лицензией.
 * Текста техники здесь нет — источник только фото; подбор пары идёт по названию файла.
 */
export async function fetchWikimediaCommons(): Promise<SourceRecord[]> {
  const records = new Map<number, SourceRecord>();
  for (const category of await categories()) {
    let cont: Record<string, string> = {};
    do {
      const page = await query({
        generator: 'categorymembers',
        gcmtitle: category,
        gcmtype: 'file',
        gcmlimit: '200',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata',
        iiurlwidth: String(THUMB_WIDTH),
        ...cont,
      });
      for (const file of Object.values(page.query?.pages ?? {})) {
        const info = file.imageinfo?.[0];
        if (!info || !PHOTO.test(file.title) || records.has(file.pageid)) continue;
        const meta = info.extmetadata ?? {};
        const license = stripHtml(meta.LicenseShortName?.value ?? '');
        if (!FREE_LICENSE.test(license)) continue;
        const name = file.title.replace(/^File:/, '').replace(PHOTO, '');
        records.set(file.pageid, {
          source: 'wikimedia-commons',
          sourceId: String(file.pageid),
          url: info.descriptionurl,
          name,
          altNames: [
            stripHtml(meta.ObjectName?.value ?? ''),
            stripHtml(meta.ImageDescription?.value ?? '').slice(0, 200),
            category.replace(/^Category:/, ''),
          ].filter(Boolean),
          instructions: [],
          images: [info.thumburl ?? info.url],
          imageCredits: [
            {
              license,
              author: stripHtml(meta.Artist?.value ?? '') || null,
              page: info.descriptionurl,
            },
          ],
        });
      }
      cont = page.continue ?? {};
    } while (Object.keys(cont).length);
  }
  return [...records.values()];
}
