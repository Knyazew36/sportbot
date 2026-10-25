import type { Href } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { type WorkoutSummary } from '@sportbot/api/entities/workout';

import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Rise } from '@/shared/ui/kit/Reveal';
import { StatGrid } from '@/shared/ui/kit/StatGrid';
import { Text } from '@/shared/ui/kit/Typography';

type WorkoutFactsProps = {
  summary: WorkoutSummary;
  editTo: Href;
};

export const WorkoutFacts = ({ summary, editTo }: WorkoutFactsProps) => (
  <Rise className="px-gutter gap-3">
    <StatGrid
      framed
      items={[
        { label: pluralize(summary.sets, SET_FORMS, { withCount: false }), value: summary.sets },
        {
          label: pluralize(summary.exercisesTotal, EXERCISE_FORMS, { withCount: false }),
          value: `${summary.exercisesDone}/${summary.exercisesTotal}`,
        },
        { label: 'минут', value: summary.minutes },
      ]}
    />
    {summary.tonnage > 0 && (
      <Text size="sm" tone="soft">
        Поднято за тренировку: {summary.tonnage.toLocaleString('ru-RU')} кг
      </Text>
    )}
    {summary.cardioName && (
      <Text size="sm" tone="soft">
        Кардио в конце: {summary.cardioName}
        {summary.cardioMinutes ? `, ${summary.cardioMinutes} мин` : ''}
      </Text>
    )}
    {summary.sets > 0 && (
      <ButtonLink href={editTo} variant="outline" block icon={Pencil}>
        Исправить подходы
      </ButtonLink>
    )}
  </Rise>
);
