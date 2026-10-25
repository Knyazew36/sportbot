/** Высота полосы под вырезом: тонкая заливка 6px и волна 10px. Без текста — цвет сам говорит, что идёт тренировка */
export const LIVE_H = 16;

// Волны — те же плитки, что маски sb-wave-front / sb-wave-back во фронте: шаг, высота блока, гребень сверху и впадина
export const FRONT_WAVE = { period: 80, height: 8, top: 2.4, bottom: 7.2, duration: 4500 };
export const BACK_WAVE = { period: 120, height: 10, top: 10 / 3, bottom: 10, duration: 7500 };

type Wave = typeof FRONT_WAVE;

// Один сплошной контур на всю ширину, а не плитка на период: на стыках плиток просвечивала бы нитка
export const wavePath = (width: number, { period, top, bottom }: Wave) => {
  const count = Math.ceil(width / period);
  let d = `M0 0H${count * period}V${top}`;
  for (let i = count - 1; i >= 0; i--) {
    const x = i * period;
    d += `C${x + 0.75 * period} ${top} ${x + 0.75 * period} ${bottom} ${x + 0.5 * period} ${bottom}`;
    d += `S${x + 0.25 * period} ${top} ${x} ${top}`;
  }
  return `${d}Z`;
};

/** Ключ таймера отдыха — тот же, что у экрана тренировки (use-workout-flow) */
export const restTimerKey = (workoutId: number) => `rest-timer-${workoutId}`;
