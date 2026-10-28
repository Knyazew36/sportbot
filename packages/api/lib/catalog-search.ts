// Поиск справочника без сервера — копия server catalog: normalizeName (catalog.service.ts)
// и nameWords (catalog-app.service.ts). Сравнивается с nameNormalized из sync/catalog,
// поэтому нормализация обязана совпадать с серверной символ в символ

/** Как normalizeName на сервере: строчные, ё→е, всё кроме букв и цифр — пробел */
export const normalizeName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/g, ' ')
    .trim()

/** Слова запроса — все должны входить в название (как поиск в боте) */
export const searchWords = (search?: string): string[] => normalizeName(search ?? '').split(' ').filter(Boolean)

export const matchesWords = (nameNormalized: string, words: string[]): boolean =>
  words.every(word => nameNormalized.includes(word))
