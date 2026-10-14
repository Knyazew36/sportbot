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
const SINGLE_BREAK_BEFORE_ITALIC = /([^\n])\n\u0001/g;
// eslint-disable-next-line no-control-regex
const SPAN = /\u0001([^\u0001\u0002]*)\u0002/g;

// Ссылка: подпись и адрес между своими маркерами
const LINK_OPEN = '\u0003';
const LINK_SEP = '\u0004';
const LINK_CLOSE = '\u0005';

const STRIKE_OPEN = '\u0006';
const STRIKE_CLOSE = '\u0007';
// eslint-disable-next-line no-control-regex
const STRIKE = /\u0006([^\u0006\u0007]*)\u0007/g;

// eslint-disable-next-line no-control-regex
const ALL_MARKERS = /[\u0001-\u0007]/g;
// eslint-disable-next-line no-control-regex
const LINK = /\u0003([^\u0001-\u0007]*)\u0004([^\u0001-\u0007]*)\u0005/g;
const ANY_SPAN =
  // eslint-disable-next-line no-control-regex
  /\u0001([^\u0001\u0002]*)\u0002|\u0003([^\u0001-\u0007]*)\u0004([^\u0001-\u0007]*)\u0005|\u0006([^\u0006\u0007]*)\u0007/g;

/** Пометить фрагмент курсивом. Вкладывать курсив в курсив нельзя. */
export function italic(text: string): string {
  // Маркеры внутри фрагмента (например, из пользовательского ввода) сломали бы пары
  return `${ITALIC_OPEN}${plainText(text)}${ITALIC_CLOSE}`;
}

/** Пометить фрагмент зачёркнутым. Вкладывать в курсив и ссылку нельзя. */
export function strike(text: string): string {
  return `${STRIKE_OPEN}${plainText(text)}${STRIKE_CLOSE}`;
}

/**
 * Отделить курсивные фрагменты, начинающие строку, пустой строкой от текста выше.
 * Фрагмент в начале сообщения и уже отделённый не трогаются.
 */
export function separateItalic(text: string): string {
  return text.replace(SINGLE_BREAK_BEFORE_ITALIC, `$1\n\n${ITALIC_OPEN}`);
}

/**
 * Ссылка, спрятанная под подписью: в чате видно слово, по нажатию открывается адрес.
 * Вкладывать ссылку в курсив нельзя.
 */
export function link(label: string, url: string): string {
  // Кавычка в адресе закрыла бы атрибут href в HTML-разметке
  const href = url.replace(ALL_MARKERS, '').replace(/"/g, '%22');
  return `${LINK_OPEN}${label.replace(ALL_MARKERS, '')}${LINK_SEP}${href}${LINK_CLOSE}`;
}

/**
 * Текст без разметки — для платформ и мест, где её нет (всплывашки, VK).
 * Ссылка разворачивается в «подпись: адрес» — иначе адрес потерялся бы.
 */
export function plainText(text: string): string {
  return text.replace(LINK, '$1: $2').replace(ALL_MARKERS, '');
}

export type TextSpan =
  | { type: 'italic'; offset: number; length: number }
  | { type: 'strikethrough'; offset: number; length: number }
  | { type: 'text_link'; offset: number; length: number; url: string };

/**
 * Текст без маркеров и участки разметки в нём. Смещения — в единицах UTF-16,
 * как их считает Telegram (и как индексирует строки JavaScript).
 */
export function textSpans(text: string): { text: string; spans: TextSpan[] } {
  const spans: TextSpan[] = [];
  let plain = '';
  let cursor = 0;
  for (const match of text.matchAll(ANY_SPAN)) {
    plain += plainText(text.slice(cursor, match.index));
    const [, italicText, label, url, strikeText] = match;
    const content = italicText ?? label ?? strikeText;
    const offset = plain.length;
    const length = content.length;
    if (length)
      spans.push(
        italicText !== undefined
          ? { type: 'italic', offset, length }
          : strikeText !== undefined
            ? { type: 'strikethrough', offset, length }
            : { type: 'text_link', offset, length, url },
      );
    plain += content;
    cursor = match.index + match[0].length;
  }
  plain += plainText(text.slice(cursor));
  return { text: plain, spans };
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Текст для платформ с HTML-разметкой. html = false — разметки нет, текст можно слать как есть,
 * без режима разметки.
 */
export function toHtml(text: string): { text: string; html: boolean } {
  if (
    !text.includes(ITALIC_OPEN) &&
    !text.includes(LINK_OPEN) &&
    !text.includes(STRIKE_OPEN)
  )
    return { text: plainText(text), html: false };
  const html = escapeHtml(text)
    .replace(SPAN, '<i>$1</i>')
    .replace(STRIKE, '<s>$1</s>')
    .replace(LINK, '<a href="$2">$1</a>');
  return { text: plainText(html), html: true };
}
