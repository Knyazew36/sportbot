// Zero-width space/joiner/non-joiner, LTR/RTL marks, bidi embedding controls,
// word joiner, BOM, soft hyphen — invisible but non-whitespace, so String.prototype.trim()
// doesn't strip them and a string made entirely of these looks non-empty.
const INVISIBLE_CODE_POINTS = [
  0x200b, // zero width space
  0x200c, // zero width non-joiner
  0x200d, // zero width joiner
  0x200e, // left-to-right mark
  0x200f, // right-to-left mark
  0x202a, // LTR embedding
  0x202b, // RTL embedding
  0x202c, // pop directional formatting
  0x202d, // LTR override
  0x202e, // RTL override
  0x2060, // word joiner
  0xfeff, // BOM / zero width no-break space
  0x00ad, // soft hyphen
];

const INVISIBLE_CHARS_REGEX = new RegExp(
  `[${INVISIBLE_CODE_POINTS.map((code) => String.fromCharCode(code)).join('')}]`,
  'g',
);

export const stripInvisibleChars = (value: string): string =>
  value.replace(INVISIBLE_CHARS_REGEX, '');

export const sanitizeText = (value: string): string =>
  stripInvisibleChars(value).trim();
