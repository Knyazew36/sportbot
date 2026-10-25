// Ссылку на поиск не храним в базе: она собирается из названия и сразу есть у каждой записи,
// включая черновики. Конкретный ролик админ ставит в videoUrl, и он заменяет поиск
export const videoSearchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} техника выполнения`)}`;
