/**
 * Отпечаток ответа сервера (FNV-1a по JSON): совпал с прошлым — строки в базе уже такие,
 * перезаписывать их незачем. Иначе каждая запись будит экраны, читающие таблицу
 */
export const contentHash = (value: unknown): string => {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${text.length}:${(hash >>> 0).toString(16)}`;
};
