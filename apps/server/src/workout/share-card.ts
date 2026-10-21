import { Resvg } from '@resvg/resvg-js';
import * as path from 'path';

const W = 1080;
const H = 1350;
const M = 72;

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

/** Показатели табло: тоннаж — только если что-то поднимали. */
const statsOf = (card: ShareCardImage) => [
  { value: String(card.minutes), label: 'минут' },
  {
    value: String(card.sets),
    label: plural(card.sets, 'подход', 'подхода', 'подходов'),
  },
  ...(card.tonnage > 0
    ? [{ value: thousands(card.tonnage), label: 'кг поднято' }]
    : [
        {
          value: String(card.exercisesDone),
          label: plural(card.exercisesDone, 'упражнение', 'упражнения', 'упражнений'),
        },
      ]),
];

const VISIBLE_EXERCISES = 4;

/**
 * Карточка результата для пересылки — плакат финиша в стиле Спортбота: вердикт, комплекс,
 * табло цифр и чёрная плашка «что сделано». Без имени и серии: картинку постят как есть. SVG собирается кодом, PNG рисует resvg.
 */
export function renderShareCard(card: ShareCardImage): Buffer {
  const c = PALETTES[card.palette];
  const stats = statsOf(card);
  const colW = (W - 2 * M) / stats.length;
  const shown = card.exercises.slice(0, VISIBLE_EXERCISES);
  const more = card.exercises.length - shown.length;

  const statCells = stats
    .map((s, i) => {
      const x = M + i * colW + (i ? 28 : 0);
      // Длинный тоннаж ужимаем, чтобы не залез в соседнюю колонку
      const size = s.value.length >= 5 ? 100 : 128;
      return [
        i
          ? `<rect x="${M + i * colW}" y="600" width="3" height="170" fill="${c.ink}"/>`
          : '',
        `<text x="${x}" y="730" font-family="Oswald" font-weight="700" font-size="${size}" fill="${c.ink}">${esc(s.value)}</text>`,
        `<text x="${x}" y="772" font-family="Onest" font-weight="600" font-size="24" letter-spacing="3" fill="${c.ink}" fill-opacity="0.55">${esc(s.label.toUpperCase())}</text>`,
      ].join('');
    })
    .join('');

  const rowTop = 958;
  const rowH = 84;
  const rows = shown
    .map((e, i) => {
      const y = rowTop + i * rowH;
      const meta = e.sets
        ? `${e.sets} ${plural(e.sets, 'подход', 'подхода', 'подходов')}`
        : 'без записи';
      return [
        i
          ? `<rect x="${M + 36}" y="${y - 50}" width="${W - 2 * M - 72}" height="1.5" fill="${c.paper}" fill-opacity="0.18"/>`
          : '',
        `<text x="${M + 36}" y="${y}" font-family="Onest" font-weight="400" font-size="32" fill="${c.paper}">${esc(cut(e.name, 28))}</text>`,
        `<text x="${M + 36}" y="${y + 26}" font-family="JetBrains Mono" font-size="16" fill="${c.paper}" fill-opacity="0.5">${esc(meta.toUpperCase())}</text>`,
        e.best
          ? `<text x="${W - M - 36}" y="${y + 12}" text-anchor="end" font-family="Oswald" font-weight="700" font-size="52" fill="${c.paper}">${esc(e.best)}</text>`
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
  <clipPath id="halo"><circle cx="${W - 150}" cy="250" r="260"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="${c.paper}"/>
<rect x="${W - 410}" y="-10" width="520" height="520" fill="url(#dots)" opacity="0.3" clip-path="url(#halo)"/>

<text x="${M}" y="104" font-family="Oswald" font-weight="700" font-size="34" letter-spacing="4" fill="${c.ink}">СПОРТБОТ</text>
<text x="${M + 210}" y="104" font-family="JetBrains Mono" font-size="24" fill="${c.ink}" fill-opacity="0.5">${esc(card.date)}</text>
<rect x="${M}" y="128" width="${W - 2 * M}" height="6" fill="${c.ink}"/>

<text x="${M}" y="262" font-family="Cormorant" font-style="italic" font-size="84" fill="${c.ink}">тренировка</text>
<text x="${M - 6}" y="488" font-family="Oswald" font-weight="700" font-size="210" textLength="${W - 2 * M + 6}" lengthAdjust="spacingAndGlyphs" fill="${c.accent}">ЗАСЧИТАНА</text>
<text x="${M}" y="546" font-family="Onest" font-weight="600" font-size="36" fill="${c.ink}">${esc(cut(card.complexName, 40))}</text>

${statCells}
<rect x="${M}" y="806" width="${W - 2 * M}" height="3" fill="${c.ink}"/>

<rect x="${M}" y="840" width="${W - 2 * M}" height="${H - 840 - 90}" fill="${c.ink}"/>
<rect x="${M}" y="840" width="${W - 2 * M}" height="${H - 840 - 90}" fill="url(#lanes)" opacity="0.16"/>
<text x="${M + 36}" y="896" font-family="JetBrains Mono" font-size="22" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">ЧТО СДЕЛАНО</text>
${more > 0 ? `<text x="${W - M - 36}" y="896" text-anchor="end" font-family="JetBrains Mono" font-size="22" letter-spacing="2" fill="${c.paper}" fill-opacity="0.6">+ ЕЩЁ ${more}</text>` : ''}
${rows}

<rect x="0" y="${H - 64}" width="${W}" height="64" fill="url(#lanes)" opacity="0.5"/>
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: {
      fontFiles: FONT_FILES,
      loadSystemFonts: false,
      defaultFontFamily: 'Onest',
    },
  })
    .render()
    .asPng();
}
