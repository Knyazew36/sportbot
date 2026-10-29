import { useWindowDimensions } from 'react-native';

import { fitLineHeight } from '@/shared/ui/kit/Typography';

// Межстрочный плакатного hero: leading-[110px] при кегле 128
const HERO_LEADING = 110 / 128;

const heroFont = (fontSize: number) => ({ fontSize, lineHeight: fontSize * HERO_LEADING });

/**
 * Размеры фокус-экранов тренировки от размера окна — то, что во фронте сделано через min(…px, …vw, …svh).
 * Uniwind не умеет min() в классах и единицу svh: такие классы роняют рендер, поэтому считаем в JS
 */
export const useFocusSizes = () => {
  const { width, height } = useWindowDimensions();
  const vw = width / 100;
  const vh = height / 100;

  const setClock = Math.min(150, 34 * vw);
  const roundClock = Math.min(110, 26 * vw);
  const countdown = Math.min(80, 19 * vw, 10 * vh);

  return {
    /** Секундомер подхода */
    setClock,
    setClockStyle: heroFont(setClock),
    /** Секундомер круга суперсета */
    roundClock,
    roundClockStyle: heroFont(roundClock),
    /** Обратный отсчёт отдыха и разминки внутри кольца */
    countdown,
    countdownStyle: heroFont(countdown),
    /** Кольцо отдыха и разминки */
    timerRing: Math.round(Math.min(250, 66 * vw, 30 * vh)),
    /** Кольцо минуты подхода и кнопка «дальше» на паузе круга */
    pauseButton: Math.round(Math.min(140, 20 * vh)),
    /** Рамка заголовка «Отдых» / «Разминка»: постоянная высота, чтобы кольцо не прыгало.
     *  Ровно строка 3xl: ниже неё рамка срезает слово, а ужатое «Отдых окончен» ниже и так влезает */
    headline: fitLineHeight('3xl'),
  };
};
