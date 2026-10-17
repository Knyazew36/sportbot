/** Запись внешнего источника техники в общем формате: из неё content:enrich берёт факты. */
export interface SourceRecord {
  source: string;
  sourceId: string;
  url: string;
  /** Основное (английское) название. */
  name: string;
  /** Названия на других языках — для подбора пары по русскому названию. */
  altNames: string[];
  /** Шаги/абзацы техники простым текстом, по порядку. */
  instructions: string[];
  /** Полные ссылки на картинки: первая — старт, вторая — финиш, если есть. */
  images: string[];
}

export interface SourceSnapshot {
  source: string;
  fetchedAt: string;
  records: SourceRecord[];
}
