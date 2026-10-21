import { Resvg } from '@resvg/resvg-js';
import * as path from 'path';

/** Квадрат: в Telegram картинка показывается крупнее, чем вытянутая вверх. */
const W = 1280;
const H = 1280;
const M = 56;

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

const thousands = (n: number) =>
  n.toLocaleString('ru-RU').replace(/\s/g, ' ');

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

const VISIBLE_EXERCISES = 6;

const RESVG_FONTS = {
  fontFiles: FONT_FILES,
  loadSystemFonts: false,
  defaultFontFamily: 'Onest',
};


/** Верх — две колонки: короткий вердикт слева, табло цифр справа; низ — плашка упражнений на всю ширину. */
const STATS_X = 690;
const STATS_TOP = 150;
const STATS_BOTTOM = 560;
/** Жёсткая тень плиток — как у кнопок Mini App */
const SHADOW = 7;
const TILE_GAP = 18;
const TOP = 596;
const BOTTOM = 1196;
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
  const shown = card.exercises.slice(0, VISIBLE_EXERCISES);
  const more = card.exercises.length - shown.length;

  // Табло — плитки-«номера» с жёсткой тенью, как кнопки приложения. Главная цифра залита цветом
  // палитры, остальные — в контуре. Подпись слева на линии числа, число справа: читается одной строкой
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
      return [
        `<rect x="${x + SHADOW}" y="${y + SHADOW}" width="${tileW}" height="${tileH}" fill="${c.ink}"/>`,
        `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" fill="${hero ? c.accent : c.paper}" stroke="${c.ink}" stroke-width="3"/>`,
        `<text x="${x + 26}" y="${y + tileH - 30}" font-family="Onest" font-weight="600" font-size="22" letter-spacing="3" fill="${fg}" fill-opacity="${hero ? 0.85 : 0.6}">${esc(s.label.toUpperCase())}</text>`,
        `<text x="${x + tileW - 24}" y="${y + tileH - 24}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="${hero ? 94 : 86}" fill="${fg}">${esc(s.value)}</text>`,
      ].join('');
    })
    .join('');

  const pad = 40;
  const rowTop = TOP + 136;
  const rowH = 80;
  const rows = shown
    .map((e, i) => {
      const y = rowTop + i * rowH;
      const meta = e.sets
        ? `${e.sets} ${plural(e.sets, 'подход', 'подхода', 'подходов')}`
        : 'без записи';
      // Сколько знаков названия влезает слева от лучшего подхода: короткий подход — длиннее название
      const bestW = e.best ? e.best.length * 25 + 24 : 0;
      const nameMax = Math.floor((PANEL_W - 2 * pad - bestW) / 16);
      return [
        `<rect x="${PANEL_X + pad}" y="${y - 52}" width="${PANEL_W - 2 * pad}" height="1.5" fill="${c.paper}" fill-opacity="0.18"/>`,
        `<text x="${PANEL_X + pad}" y="${y}" font-family="Onest" font-weight="400" font-size="30" fill="${c.paper}">${esc(cut(e.name, nameMax))}</text>`,
        `<text x="${PANEL_X + pad}" y="${y + 26}" font-family="JetBrains Mono" font-size="16" fill="${c.paper}" fill-opacity="0.5">${esc(meta.toUpperCase())}</text>`,
        e.best
          ? `<text x="${W - M - pad}" y="${y + 12}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="48" fill="${c.paper}">${esc(e.best)}</text>`
          : '',
      ].join('');
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
    <circle cx="9" cy="9" r="3.2" fill="${c.accent}"/>
  </pattern>
  <pattern id="lanes" width="28" height="28" patternUnits="userSpaceOnUse">
    <rect width="2" height="28" fill="${c.accent}"/>
  </pattern>
  <clipPath id="halo"><circle cx="470" cy="330" r="230"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="${c.paper}"/>
<rect x="230" y="90" width="480" height="480" fill="url(#dots)" opacity="0.3" clip-path="url(#halo)"/>

<text x="${M}" y="96" font-family="Oswald" font-weight="700" font-size="34" letter-spacing="4" fill="${c.ink}">СПОРТБОТ</text>
<text x="${W - M}" y="96" text-anchor="end" font-family="JetBrains Mono" font-size="24" fill="${c.ink}" fill-opacity="0.55">${esc(card.date)}</text>
<rect x="${M}" y="120" width="${W - 2 * M}" height="6" fill="${c.ink}"/>

<text x="${M}" y="194" font-family="Cormorant" font-style="italic" font-size="84" fill="${c.ink}">результат —</text>
<text x="${M - 8}" y="486" font-family="Oswald" font-weight="700" font-size="300" fill="${c.accent}">ЕСТЬ</text>
<text x="${M}" y="548" font-family="Onest" font-weight="600" font-size="36" fill="${c.ink}">${esc(cut(card.complexName, 30))}</text>

${statCells}

<rect x="${PANEL_X}" y="${TOP}" width="${PANEL_W}" height="${BOTTOM - TOP}" fill="${c.ink}"/>
<rect x="${PANEL_X}" y="${TOP}" width="${PANEL_W}" height="${BOTTOM - TOP}" fill="url(#lanes)" opacity="0.16"/>
<text x="${PANEL_X + pad}" y="${TOP + 58}" font-family="JetBrains Mono" font-size="22" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">ЧТО СДЕЛАНО</text>
${more > 0 ? `<text x="${W - M - pad}" y="${TOP + 58}" text-anchor="end" font-family="JetBrains Mono" font-size="22" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">+ ЕЩЁ ${more}</text>` : ''}
${rows}

<rect x="0" y="${H - 56}" width="${W}" height="56" fill="url(#lanes)" opacity="0.5"/>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: RESVG_FONTS,
  })
    .render()
    .asPng();
}
