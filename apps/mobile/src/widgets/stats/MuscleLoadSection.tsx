import { useMuscleLoad } from '@/shared/local/entities/stats';

import { ROUTES } from '@/shared/config/routes';

import { statsLink } from './links';
import { MuscleLoad } from './MuscleLoad';
import { PERIOD_DAYS, PERIOD_TEXT, type Period } from './periods';

// Баланс мышц — порт widgets/stats/MuscleLoadSection.tsx: подходов в неделю в среднем за период — одна неделя
// слишком шумная; «забыто» — ноль за весь период. Тап по мышце — упражнения, где она основная. userId — статистика друга
export const MuscleLoadSection = ({ period, userId }: { period: Period; userId?: number }) => {
  const load = useMuscleLoad(Math.round(PERIOD_DAYS[period] / 7), userId);

  if (!load.data?.length) return null;

  return (
    <MuscleLoad
      title="Баланс мышц"
      aside="подходов в неделю"
      note={`Среднее ${PERIOD_TEXT[period]}: основная мышца упражнения — 1 подход, вспомогательная — 0,5. «Забыто» — ни одного подхода. Нажми на мышцу — её упражнения.`}
      items={load.data}
      linkTo={(m) => statsLink(ROUTES.STATS_EXERCISES, { userId, period, muscle: m.muscleId })}
    />
  );
};
