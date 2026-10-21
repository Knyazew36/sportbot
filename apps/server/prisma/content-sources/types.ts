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
  /** Лицензия и автор каждой картинки — в том же порядке, что images. Нет — лицензия всего источника. */
  imageCredits?: ImageCredit[];
}

/** Атрибуция картинки: то, что уходит в imageSource/imageLicense/imageAuthor растяжки. */
export interface ImageCredit {
  license: string;
  author: string | null;
  /** Страница файла у источника. */
  page: string;
}

export interface SourceSnapshot {
  source: string;
  fetchedAt: string;
  records: SourceRecord[];
}
