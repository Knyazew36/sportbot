import { Resvg } from '@resvg/resvg-js';

const WIDTH = 800;
const HEIGHT = 450;
const PAD = { left: 70, right: 30, top: 60, bottom: 60 };

const escapeXml = (value: string): string =>
  value.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);

const ddmm = (date: Date): string =>
  `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

/** «Круглый» шаг сетки, чтобы на оси Y было около пяти делений. */
function niceStep(range: number): number {
  const rough = range / 5;
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  return (
    (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power
  );
}

/**
 * График прогресса: ось X — даты тренировок, ось Y — кг или повторы (подпись — axisLabel). SVG собирается кодом,
 * в PNG 800×450 переводит resvg (готовые бинарники, без сборки native-модулей).
 */
export function renderProgressChart(
  title: string,
  points: { date: Date; value: number }[],
  axisLabel: string,
): Buffer {
  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const step = niceStep(Math.max(rawMax - rawMin, 1));
  const min = Math.max(
    0,
    Math.floor(rawMin / step) * step - (rawMin === rawMax ? step : 0),
  );
  const max = Math.ceil(rawMax / step) * step + (rawMin === rawMax ? step : 0);

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left +
    (points.length === 1
      ? plotWidth / 2
      : (index / (points.length - 1)) * plotWidth);
  const y = (value: number) =>
    PAD.top + plotHeight - ((value - min) / (max - min || 1)) * plotHeight;

  const grid: string[] = [];
  for (let value = min; value <= max + step / 1000; value += step) {
    const yy = y(value).toFixed(1);
    grid.push(
      `<line x1="${PAD.left}" y1="${yy}" x2="${WIDTH - PAD.right}" y2="${yy}" stroke="#e3e6ea" stroke-width="1"/>`,
      `<text x="${PAD.left - 10}" y="${yy}" dy="5" text-anchor="end" font-size="15" fill="#5b6470">${Number(value.toFixed(2))}</text>`,
    );
  }

  // Подписей дат — не больше восьми, иначе они слипаются
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const labels = points
    .map((point, index) =>
      index % labelEvery === 0 || index === points.length - 1
        ? `<text x="${x(index).toFixed(1)}" y="${HEIGHT - PAD.bottom + 26}" text-anchor="middle" font-size="14" fill="#5b6470">${ddmm(point.date)}</text>`
        : '',
    )
    .join('');

  const line = points
    .map(
      (point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`,
    )
    .join(' ');
  const dots = points
    .map(
      (point, index) =>
        `<circle cx="${x(index).toFixed(1)}" cy="${y(point.value).toFixed(1)}" r="5" fill="#2f6fed"/>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
<text x="${PAD.left}" y="36" font-size="22" font-weight="bold" fill="#1c2430">${escapeXml(title.slice(0, 50))}</text>
<text x="${WIDTH - PAD.right}" y="36" text-anchor="end" font-size="15" fill="#5b6470">${escapeXml(axisLabel)}</text>
${grid.join('')}
<line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${HEIGHT - PAD.bottom}" stroke="#9aa3ad" stroke-width="1"/>
<line x1="${PAD.left}" y1="${HEIGHT - PAD.bottom}" x2="${WIDTH - PAD.right}" y2="${HEIGHT - PAD.bottom}" stroke="#9aa3ad" stroke-width="1"/>
${labels}
<polyline points="${line}" fill="none" stroke="#2f6fed" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
${dots}
</svg>`;

  return new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
  })
    .render()
    .asPng();
}
