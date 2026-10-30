import { router, type Href } from 'expo-router';
import { Trophy } from 'lucide-react-native';

import { setText, type StatsRecord } from '@sportbot/api/entities/stats';

import { formatDate } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/kit/Icon';
import { ListRow } from '@/shared/ui/kit/ListRow';
import { Poster } from '@/shared/ui/kit/Typography';

type RecordRowProps = { record: StatsRecord; to: Href };

// Личный рекорд — порт widgets/stats/RecordRow.tsx: новый лучший подход против прежнего.
// Строка ведёт на прогресс упражнения
export const RecordRow = ({ record, to }: RecordRowProps) => (
  <ListRow
    lead={<Icon as={Trophy} className="text-sb-gold size-4" />}
    title={record.name}
    meta={`${formatDate(record.date, 'd MMM')} · было ${setText(record.previous, record.unit)}`}
    onPress={() => router.push(to)}
    trail={
      <Poster size="sm" tone="primary" numeric>
        {setText(record.set, record.unit)}
      </Poster>
    }
  />
);
