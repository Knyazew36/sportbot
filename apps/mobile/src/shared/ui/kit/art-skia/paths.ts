import { Skia } from '@shopify/react-native-skia';

// Общие контуры сцен — те же d, что во фронте (apps/frontend/src/shared/ui/kit/Art.tsx)

export const KETTLEBELL_HANDLE = 'M-26 -26 C-38 -78 38 -78 26 -26';

// Звезда в четыре луча вокруг (x, y)
export const starPath = (x: number, y: number, size: number) => {
  const q = size / 4;
  return `M${x} ${y - size} L${x + q} ${y - q} L${x + size} ${y} L${x + q} ${y + q} L${x} ${y + size} L${x - q} ${y + q} L${x - size} ${y} L${x - q} ${y - q} Z`;
};

// Круг контуром — для clip растра: Group в Skia режет по пути, а не по фигуре
export const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;

// Растр «полутон» под круг (cx, cy, r): сетка точек с шагом size, как SVG <Pattern> во фронте.
// Один путь со всеми точками — один вызов отрисовки; обрезку по кругу делает clip сцены
export const halftoneDots = (cx: number, cy: number, r: number, size = 6) => {
  const builder = Skia.PathBuilder.Make();
  const dot = size / 4.2;
  const from = Math.floor((cx - r) / size);
  const to = Math.ceil((cx + r) / size);
  const fromY = Math.floor((cy - r) / size);
  const toY = Math.ceil((cy + r) / size);
  for (let i = from; i <= to; i++) {
    for (let j = fromY; j <= toY; j++) builder.addCircle(i * size + size / 2, j * size + size / 2, dot);
  }
  return builder.build();
};
