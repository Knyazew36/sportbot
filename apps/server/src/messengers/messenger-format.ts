/**
 * Курсив в тексте сообщения. Общий контракт несёт его маркерами внутри `text`, а каждый канал
 * переводит маркеры в разметку своей платформы: Telegram — entities (экранировать ничего не надо),
 * MAX — HTML. Остальной текст остаётся обычным: имена и названия от пользователей не ломают разметку.
 *
 * Маркеры — управляющие символы, которых нет ни в текстах бота, ни в обычном вводе пользователя.
 */
const ITALIC_OPEN = '\u0001';
const ITALIC_CLOSE = '\u0002';
// Маркеры — намеренно управляющие символы
// eslint-disable-next-line no-control-regex
const MARKERS = /[\u0001\u0002]/g;
// eslint-disable-next-line no-control-regex
const SINGLE_BREAK_BEFORE_ITALIC = /([^\n])\n\u0001/g;
// eslint-disable-next-line no-control-regex
const SPAN = /\u0001([^\u0001\u0002]*)\u0002/g;

/** Пометить фрагмент курсивом. Вкладывать курсив в курсив нельзя. */
export function italic(text: string): string {
  // Маркеры внутри фрагмента (например, из пользовательского ввода) сломали бы пары
  return `${ITALIC_OPEN}${text.replace(MARKERS, '')}${ITALIC_CLOSE}`;
}

/**
 * Отделить курсивные фрагменты, начинающие строку, пустой строкой от текста выше.
 * Фрагмент в начале сообщения и уже отделённый не трогаются.
 */
export function separateItalic(text: string): string {
  return text.replace(SINGLE_BREAK_BEFORE_ITALIC, `$1\n\n${ITALIC_OPEN}`);
}

/** Текст без разметки — для платформ и мест, где курсива нет (всплывашки, VK). */
export function plainText(text: string): string {
  return text.replace(MARKERS, '');
}

/**
 * Текст без маркеров и участки курсива в нём. Смещения — в единицах UTF-16,
 * как их считает Telegram (и как индексирует строки JavaScript).
 */
export function italicSpans(text: string): {
  text: string;
  spans: { offset: number; length: number }[];
} {
  const spans: { offset: number; length: number }[] = [];
  let plain = '';
  let cursor = 0;
  for (const match of text.matchAll(SPAN)) {
    plain += plainText(text.slice(cursor, match.index));
    if (match[1].length)
      spans.push({ offset: plain.length, length: match[1].length });
    plain += match[1];
    cursor = match.index + match[0].length;
  }
  plain += plainText(text.slice(cursor));
  return { text: plain, spans };
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Текст для платформ с HTML-разметкой. html = false — курсива нет, текст можно слать как есть,
 * без режима разметки.
 */
export function toHtml(text: string): { text: string; html: boolean } {
  if (!text.includes(ITALIC_OPEN))
    return { text: plainText(text), html: false };
  const html = escapeHtml(text).replace(SPAN, '<i>$1</i>');
  return { text: plainText(html), html: true };
}
