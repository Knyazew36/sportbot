/** Формат файлов пайплайна техники: content:export → content:enrich → content:apply-guides. */

export interface ExportedExercise {
  id: number;
  code: string | null;
  updatedAt: string;
  name: string;
  technique: string | null;
  steps: string[];
  mistakes: string[];
  imagePath: string | null;
  imageEndPath: string | null;
  equipment: string | null;
  measure?: 'REPS' | 'TIME' | 'MINUTES';
  muscles: { code: string; role: string }[];
  joints: string[];
}

export interface ExportedStretch {
  id: number;
  code: string | null;
  updatedAt: string;
  name: string;
  howTo: string | null;
  steps: string[];
  mistakes: string[];
  imagePath: string | null;
  imageEndPath: string | null;
  holdSeconds: number;
  perSide: boolean;
  muscles: string[];
}

export interface ExportFile {
  exportedAt: string;
  exercises: ExportedExercise[];
  stretches: ExportedStretch[];
}

export interface GuideEntry {
  id: number;
  /** Код записи справочника — по нему content:merge находит её в catalog.json; у черновиков null. */
  code?: string | null;
  /** updatedAt из экспорта: запись, изменённая позже, при применении пропускается. */
  updatedAt: string;
  description: string;
  steps: string[];
  mistakes: string[];
  /** Ссылка на фото финиша; только если у записи его ещё нет. */
  imageEnd?: string;
}

export interface GuidesFile {
  exportedAt: string;
  exercises: GuideEntry[];
  stretches: GuideEntry[];
}

export const GUIDE_LIMITS = {
  description: 2000,
  items: 20,
  item: 300,
} as const;

/** Ошибки формы одной записи guides.json; пустой массив — запись годится. */
export function guideErrors(entry: GuideEntry): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(entry.id)) errors.push('нет id');
  if (Number.isNaN(Date.parse(entry.updatedAt))) errors.push('нет updatedAt');
  if (typeof entry.description !== 'string' || !entry.description.trim())
    errors.push('пустое описание');
  else if (entry.description.length > GUIDE_LIMITS.description)
    errors.push(`описание длиннее ${GUIDE_LIMITS.description}`);
  for (const field of ['steps', 'mistakes'] as const) {
    const list = entry[field];
    if (!Array.isArray(list)) {
      errors.push(`${field} — не массив`);
      continue;
    }
    if (list.length > GUIDE_LIMITS.items)
      errors.push(`${field}: больше ${GUIDE_LIMITS.items} пунктов`);
    if (
      list.some(
        (item) =>
          typeof item !== 'string' ||
          !item.trim() ||
          item.length > GUIDE_LIMITS.item,
      )
    )
      errors.push(`${field}: пустой пункт или длиннее ${GUIDE_LIMITS.item}`);
  }
  if (entry.imageEnd !== undefined && !/^https?:\/\//i.test(entry.imageEnd))
    errors.push('imageEnd — не ссылка');
  return errors;
}
