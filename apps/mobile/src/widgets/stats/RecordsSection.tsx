import { useRecords } from '@sportbot/api/entities/stats';

import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { List } from '@/shared/ui/kit/ListRow';

import { exerciseStatsLink, statsLink } from './links';
import { PERIOD_DAYS, PERIOD_TEXT, type Period } from './periods';
import { RecordRow } from './RecordRow';
import { StatsSection } from './StatsSection';

const LAST = 5;

// Последние личные рекорды за период — порт widgets/stats/RecordsSection.tsx; рекордов нет — блока нет.
// userId — статистика друга
export const RecordsSection = ({ period, userId }: { period: Period; userId?: number }) => {
  const records = useRecords({ limit: LAST, days: PERIOD_DAYS[period] }, userId);

  if (!records.data?.length) return null;

  return (
    <StatsSection
      title="Рекорды"
      aside={PERIOD_TEXT[period]}
      note="Тренировки, где лучший подход побил все прежние. «Было» — прошлый лучший."
    >
      <List>
        {records.data.map((r) => (
          <RecordRow
            key={`${r.exerciseId}-${r.date}`}
            record={r}
            to={exerciseStatsLink(r.exerciseId, { userId, period })}
          />
        ))}
      </List>
      <ButtonLink href={statsLink(ROUTES.STATS_RECORDS, { userId, period })} variant="outline" block>
        Все рекорды
      </ButtonLink>
    </StatsSection>
  );
};
