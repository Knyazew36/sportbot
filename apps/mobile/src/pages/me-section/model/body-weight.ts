const num = (value: number) => value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });

/** Изменение веса за период со знаком: «+1,5», «−0,8», «±0»; меньше двух записей — null */
export const weightChange = (points: { value: number }[]) => {
  if (points.length < 2) return null;
  const change = points.at(-1)!.value - points[0]!.value;
  return `${change > 0 ? '+' : change < 0 ? '−' : '±'}${num(Math.abs(change))}`;
};
