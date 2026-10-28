import { useStatsSummary } from '@/shared/local/entities/stats';

import { QueryState } from '@/shared/ui/kit/QueryState';

import { StatsSection } from './StatsSection';
import { StreakPanel } from './StreakPanel';

// Серия и её рекорд — порт widgets/stats/StatsSummarySection.tsx: от периода не зависят, поэтому стоят
// над переключателем. Посещаемость за период — отдельным блоком ниже. userId — статистика друга
export const StatsSummarySection = ({ userId }: { userId?: number }) => {
  const summary = useStatsSummary(userId);

  return (
    <QueryState query={summary}>
      {(s) => (
        <StatsSection
          title="Серия"
          aside={`эта неделя: ${s.week.done} из ${s.week.planned}`}
          note="Тренировки по расписанию подряд, без пропусков. Пауза серию не обнуляет. Рекорд — самая длинная серия."
        >
          <StreakPanel current={s.currentStreak} record={s.bestStreak} className="" />
        </StatsSection>
      )}
    </QueryState>
  );
};
