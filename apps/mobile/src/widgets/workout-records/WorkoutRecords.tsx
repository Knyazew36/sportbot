import { View } from 'react-native';
import { Trophy } from 'lucide-react-native';

import type { WorkoutRecordResponseDto } from '@sportbot/api/generated/model';
import { durationText } from '@sportbot/api/lib/measure';

import { Icon } from '@/shared/ui/kit/Icon';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { Poster, Text } from '@/shared/ui/kit/Typography';

// У веса рядом повторы: рекорд бывает и на том же весе — больше повторов
const amount = (value: number, unit: WorkoutRecordResponseDto['unit'], reps: number) =>
  unit === 'sec'
    ? durationText(value)
    : unit === 'kg'
      ? `${value.toLocaleString('ru-RU')} кг × ${reps}`
      : `${value.toLocaleString('ru-RU')} ${unit === 'min' ? 'мин' : 'повт.'}`;

type WorkoutRecordsProps = {
  records: WorkoutRecordResponseDto[];
  /** Сколько показать; остальное — подписью «ещё N» */
  limit?: number;
};

// Личные рекорды тренировки — порт widgets/workout-records/WorkoutRecords.tsx:
// лучший подход сегодня против прежнего лучшего
export const WorkoutRecords = ({ records, limit }: WorkoutRecordsProps) => {
  const shown = limit ? records.slice(0, limit) : records;
  const rest = records.length - shown.length;

  return (
    <View>
      <List>
        {shown.map((r) => (
          <ListRow
            key={r.exerciseId}
            lead={<Icon as={Trophy} className="text-sb-gold size-4" />}
            title={r.name}
            meta={`было ${amount(r.previous, r.unit, r.previousReps)}`}
            trail={
              <Poster size="lg" tone="primary" numeric numberOfLines={1}>
                {amount(r.value, r.unit, r.reps)}
              </Poster>
            }
          />
        ))}
      </List>
      {rest > 0 && (
        <Text size="sm" tone="soft" className="mt-2">
          и ещё {rest} — в итоге тренировки
        </Text>
      )}
    </View>
  );
};
