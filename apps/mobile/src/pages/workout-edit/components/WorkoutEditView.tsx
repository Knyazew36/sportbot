import { useState } from 'react';
import { View } from 'react-native';
import type { Href } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { useQueuedWorkout, type Workout } from '@sportbot/api/entities/workout';
import { supersetLabels } from '@sportbot/api/lib/superset';
import { ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Text } from '@/shared/ui/kit/Typography';
import { type EditingSet, EditSetSheet } from '@/widgets/workout/EditSetSheet';
import { SetList } from '@/widgets/workout/SetList';

import { AddSetForm } from './AddSetForm';
import { RemoveItemButton } from './RemoveItemButton';

// Исправление прошедшей тренировки из статистики: вес, повторы, лишние и забытые подходы.
// Графики и нагрузка по мышцам пересчитываются сами — бэк считает их по подходам
export const WorkoutEditView = ({ saved }: { saved: Workout }) => {
  // Правки уходят через офлайн-очередь: список показывает их сразу, не дожидаясь сервера
  const { workout } = useQueuedWorkout(saved);
  const [editing, setEditing] = useState<EditingSet | null>(null);
  const labels = supersetLabels(workout.exercises);

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          title={workout.complexName ?? 'Тренировка'}
          subtitle={`исправление · ${formatDate(workout.date, 'd MMMM yyyy')}`}
        />
      }
      className="gap-8 pb-10"
    >
      <Text size="sm" tone="muted" className="px-gutter">
        Нажми на карандаш, чтобы исправить или удалить подход, на корзину — чтобы убрать упражнение. Забытый подход
        допиши под списком, забытое упражнение — в самом низу.
      </Text>
      {workout.exercises.map((item, i, all) => (
        <ScreenSection
          key={item.id}
          // Блоком с заголовком: на этом экране упражнения различаются только названием
          variant="block"
          title={item.name}
          aside={item.superset !== null ? `суперсет ${labels[i]}` : undefined}
          // Последнее не убрать: пустая тренировка — это удаление тренировки целиком
          action={all.length > 1 ? <RemoveItemButton item={item} /> : undefined}
        >
          <SetList item={item} onEdit={setEditing} live={false} />
          <AddSetForm item={item} />
        </ScreenSection>
      ))}
      <View className="px-gutter">
        <ButtonLink
          // Роут новый: typed routes узнают о нём при следующем запуске Metro
          href={{ pathname: ROUTES.WORKOUT_EDIT_ADD, params: { workoutId: String(workout.id) } } as never as Href}
          variant="outline"
          block
          icon={Plus}
        >
          Добавить упражнение
        </ButtonLink>
      </View>
      <EditSetSheet editing={editing} onClose={() => setEditing(null)} />
    </Screen>
  );
};
