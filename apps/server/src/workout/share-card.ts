import { Resvg } from '@resvg/resvg-js';
import * as path from 'path';

import { supersetLetter, supersetRuns } from '@/program/superset';

/** Квадрат: в Telegram картинка показывается крупнее, чем вытянутая вверх. */
const W = 1280;
const H = 1280;
const M = 32;

/** Фирменные шрифты: системных на сервере нет, а Arial ломает весь плакат. */
const FONT_DIR = path.resolve(process.cwd(), 'assets/fonts');
const FONT_FILES = [
  'Oswald-Bold.ttf',
  'Onest-Regular.ttf',
  'Onest-SemiBold.ttf',
  'Cormorant-Italic.ttf',
  'JetBrainsMono-Regular.ttf',
].map((file) => path.join(FONT_DIR, file));

/** Палитры — как в Mini App: синяя по умолчанию, розовая у тех, кто выбрал женский пол. */
const PALETTES = {
  classic: { paper: '#fff8f1', ink: '#0a0a0a', accent: '#006eff' },
  rose: { paper: '#fff5f8', ink: '#1f0a14', accent: '#d6246e' },
} as const;

export type SharePalette = keyof typeof PALETTES;

export interface ShareCardExercise {
  name: string;
  /** Подходов записано; 0 — засчитано без записи */
  sets: number;
  /** Лучший подход коротко: «65 × 6», «1:30», «× 15» */
  best: string | null;
  /** Номер суперсета в комплексе; null — одиночное */
  superset: number | null;
}

export interface ShareCardImage {
  complexName: string;
  /** Дата тренировки, «21.10.2026» */
  date: string;
  minutes: number;
  sets: number;
  tonnage: number;
  exercisesDone: number;
  exercises: ShareCardExercise[];
  palette: SharePalette;
}

const esc = (value: string): string =>
  value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);

/** Ширину текста resvg не меряет — режем по числу знаков с запасом под широкие буквы. */
const cut = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const plural = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

const thousands = (n: number) => n.toLocaleString('ru-RU').replace(/\s/g, ' ');

/**
 * Показатели табло, главный — первым: поднятые килограммы впечатляют сильнее всего,
 * без веса главными становятся минуты.
 */
const statsOf = (card: ShareCardImage) => {
  const minutes = { value: String(card.minutes), label: 'минут' };
  const sets = {
    value: String(card.sets),
    label: plural(card.sets, 'подход', 'подхода', 'подходов'),
  };
  if (card.tonnage > 0)
    return [
      { value: thousands(card.tonnage), label: 'кг поднято' },
      minutes,
      sets,
    ];
  const exercises = {
    value: String(card.exercisesDone),
    label: plural(card.exercisesDone, 'упражнение', 'упражнения', 'упражнений'),
  };
  return [minutes, sets, exercises];
};

/**
 * Огонёк суперсета — как 🔥 в подписи к картинке. Эмодзи-шрифта у resvg нет, поэтому рисуем
 * контуром 24×24 в цветах эмодзи: оранжевое пламя и жёлтая сердцевина.
 */
const flame = (x: number, y: number, size: number): string =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})">` +
  `<path d="M12 23c-4.4 0-8-3.1-8-7.5 0-3.3 2-5.6 4-7.6.4 1.6 1.4 2.8 2.6 3.4C10.3 7.6 12 4 15 1c.3 3.4 2 5.3 3.4 7.3C19.6 10 20 11.7 20 13.6 20 18.9 16.4 23 12 23z" fill="#ff7a1a"/>` +
  `<path d="M12 21c-2 0-3.5-1.5-3.5-3.4 0-1.7 1.2-2.8 2.3-4 .3 1 1 1.6 1.7 1.8.2-1.6 1-3 2.2-4 .4 2 1.8 3 1.8 5.4C16.5 19 14.5 21 12 21z" fill="#ffd23f"/>` +
  `</g>`;

const RESVG_FONTS = {
  fontFiles: FONT_FILES,
  loadSystemFonts: false,
  defaultFontFamily: 'Onest',
};

/** Верх — две колонки: короткий вердикт слева, табло цифр справа; низ — плашка упражнений на всю ширину. */
const STATS_X = 700;
const STATS_TOP = 88;
const STATS_BOTTOM = 540;
/** Жёсткая тень плиток — как у кнопок Mini App */
const SHADOW = 7;
const TILE_GAP = 18;
const TOP = 568;
const BOTTOM = 1232;
const PANEL_X = M;
const PANEL_W = W - 2 * M;

/**
 * Карточка результата для пересылки — плакат финиша в стиле Спортбота: вердикт с комплексом,
 * табло цифр рядом и чёрная плашка «что сделано». Без имени и серии: картинку постят как есть.
 * SVG собирается кодом, PNG рисует resvg.
 */
export function renderShareCard(card: ShareCardImage): Buffer {
  const c = PALETTES[card.palette];
  const stats = statsOf(card);
  const statH = (STATS_BOTTOM - STATS_TOP) / stats.length;

  // Табло — плитки-«номера» с жёсткой тенью, как кнопки приложения. Главная цифра залита цветом
  // палитры, остальные — в контуре. Подпись сверху слева, число снизу справа: крупное число не наезжает на подпись
  const tileW = W - M - STATS_X - SHADOW;
  const tileH =
    (STATS_BOTTOM - STATS_TOP - SHADOW - TILE_GAP * (stats.length - 1)) /
    stats.length;
  const statCells = stats
    .map((s, i) => {
      const x = STATS_X;
      const y = STATS_TOP + i * (tileH + TILE_GAP);
      const hero = i === 0;
      const fg = hero ? c.paper : c.ink;
      // Тоннаж «123 450» шире плитки рядом с подписью — длинное число мельчим
      const size = (hero ? 108 : 100) - Math.max(0, s.value.length - 5) * 16;
      return [
        `<rect x="${x + SHADOW}" y="${y + SHADOW}" width="${tileW}" height="${tileH}" fill="${c.ink}"/>`,
        `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" fill="${hero ? c.accent : c.paper}" stroke="${c.ink}" stroke-width="3"/>`,
        `<text x="${x + 26}" y="${y + 46}" font-family="Onest" font-weight="600" font-size="28" letter-spacing="3" fill="${fg}" fill-opacity="${hero ? 0.85 : 0.6}">${esc(s.label.toUpperCase())}</text>`,
        `<text x="${x + tileW - 24}" y="${y + tileH - 16}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="${size}" fill="${fg}">${esc(s.value)}</text>`,
      ].join('');
    })
    .join('');

  const pad = 32;
  const left = PANEL_X + pad;
  const right = W - M - pad;
  const rowH = 84;
  const headH = 56;
  const barW = 6;
  const inset = 26;
  const limit = BOTTOM - 12;
  // Суперсет — заголовком «🔥 СУПЕРСЕТ A», как в подписи к картинке, и полосой цвета палитры
  // вдоль его упражнений, как блок в Mini App. Заголовок съедает место — упражнения раскладываем,
  // пока влезают, остальное уходит в «+ ЕЩЁ N». Из суперсета сделано одно — оно уже не группа
  let top = TOP + 82;
  let shown = 0;
  const parts: string[] = [];
  const row = (e: ShareCardExercise, x: number, lineX: number) => {
    const meta = e.sets
      ? `${e.sets} ${plural(e.sets, 'подход', 'подхода', 'подходов')}`
      : 'без записи';
    // Сколько знаков названия влезает слева от лучшего подхода: короткий подход — длиннее название
    const bestW = e.best ? e.best.length * 33 + 28 : 0;
    const nameMax = Math.floor((right - x - bestW) / 21);
    parts.push(
      `<rect x="${lineX}" y="${top}" width="${right - lineX}" height="1.5" fill="${c.paper}" fill-opacity="0.18"/>`,
      `<text x="${x}" y="${top + 48}" font-family="Onest" font-weight="400" font-size="40" fill="${c.paper}">${esc(cut(e.name, nameMax))}</text>`,
      `<text x="${x}" y="${top + 78}" font-family="JetBrains Mono" font-size="22" fill="${c.paper}" fill-opacity="0.5">${esc(meta.toUpperCase())}</text>`,
      e.best
        ? `<text x="${right}" y="${top + 64}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="64" fill="${c.paper}">${esc(e.best)}</text>`
        : '',
    );
    top += rowH;
    shown += 1;
  };
  for (const block of supersetRuns(card.exercises)) {
    const grouped = block.superset !== null && block.items.length > 1;
    if (!grouped) {
      for (const e of block.items) {
        if (top + rowH > limit) break;
        row(e, left, left);
      }
      continue;
    }
    // Заголовок без единого упражнения под ним не рисуем
    if (top + headH + rowH > limit) break;
    parts.push(
      `<rect x="${left}" y="${top}" width="${right - left}" height="1.5" fill="${c.paper}" fill-opacity="0.18"/>`,
      flame(left - 4, top + 12, 34),
      `<text x="${left + 38}" y="${top + 40}" font-family="JetBrains Mono" font-weight="400" font-size="26" letter-spacing="3" fill="${c.paper}">${esc(`СУПЕРСЕТ ${supersetLetter(block.superset!)}`)}</text>`,
    );
    top += headH;
    const barTop = top + 8;
    block.items.forEach((e, i) => {
      if (top + rowH > limit) return;
      // Первое упражнение идёт сразу под заголовком — черта только между упражнениями блока
      row(e, left + inset, i === 0 ? right : left + inset);
    });
    parts.push(
      `<rect x="${left}" y="${barTop}" width="${barW}" height="${top - barTop - 8}" fill="${c.accent}"/>`,
    );
  }
  const more = card.exercises.length - shown;
  const rows = parts.join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
    <circle cx="9" cy="9" r="3.2" fill="${c.accent}"/>
  </pattern>
  <pattern id="lanes" width="28" height="28" patternUnits="userSpaceOnUse">
    <rect width="2" height="28" fill="${c.accent}"/>
  </pattern>
  <clipPath id="halo"><circle cx="450" cy="300" r="230"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="${c.paper}"/>
<rect x="210" y="60" width="480" height="480" fill="url(#dots)" opacity="0.3" clip-path="url(#halo)"/>

<text x="${W - M}" y="66" text-anchor="end" font-family="JetBrains Mono" font-size="30" fill="${c.ink}" fill-opacity="0.55">${esc(card.date)}</text>

<text x="${M}" y="150" font-family="Cormorant" font-style="italic" font-size="92" fill="${c.ink}">результат —</text>
<text x="${M - 8}" y="458" font-family="Oswald" font-weight="700" font-size="296" fill="${c.accent}">ЕСТЬ</text>
<text x="${M}" y="524" font-family="Onest" font-weight="600" font-size="48" fill="${c.ink}">${esc(cut(card.complexName, 24))}</text>

${statCells}

<rect x="${PANEL_X}" y="${TOP}" width="${PANEL_W}" height="${BOTTOM - TOP}" fill="${c.ink}"/>
<rect x="${PANEL_X}" y="${TOP}" width="${PANEL_W}" height="${BOTTOM - TOP}" fill="url(#lanes)" opacity="0.16"/>
<text x="${PANEL_X + pad}" y="${TOP + 62}" font-family="JetBrains Mono" font-size="28" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">ЧТО СДЕЛАНО</text>
${more > 0 ? `<text x="${W - M - pad}" y="${TOP + 58}" text-anchor="end" font-family="JetBrains Mono" font-size="26" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">+ ЕЩЁ ${more}</text>` : ''}
${rows}

<rect x="0" y="${H - 24}" width="${W}" height="24" fill="url(#lanes)" opacity="0.5"/>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: RESVG_FONTS,
  })
    .render()
    .asPng();
}
