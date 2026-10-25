/**
 * Значение дорожки в момент t — keyframes с times из motion фронта. times — секунды по возрастанию,
 * easings — кривая каждого перехода между соседними кадрами. До первого кадра — первое значение, после — последнее
 */
export const track = (t: number, times: number[], values: number[], easings: ((x: number) => number)[]) => {
  'worklet';
  if (t <= times[0]!) return values[0]!;
  for (let i = 1; i < times.length; i++) {
    if (t <= times[i]!) {
      const span = times[i]! - times[i - 1]!;
      const p = span > 0 ? (t - times[i - 1]!) / span : 1;
      const ease = easings[Math.min(i - 1, easings.length - 1)]!;
      return values[i - 1]! + (values[i]! - values[i - 1]!) * ease(p);
    }
  }
  return values[values.length - 1]!;
};
