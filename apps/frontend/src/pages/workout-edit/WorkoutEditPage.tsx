import { PlusIcon } from 'lucide-react'
import { useLocation, useParams } from 'react-router'

import { useState } from 'react'

import { useQueuedWorkout, useWorkout } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { supersetLabels } from '@/shared/lib/superset'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { type EditingSet, EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { AddSetForm } from './components/AddSetForm'
import { RemoveItemButton } from './components/RemoveItemButton'

// Исправление прошедшей тренировки из статистики: вес, повторы, лишние и забытые подходы.
// Графики и нагрузка по мышцам пересчитываются сами — бэк считает их по подходам
const WorkoutEditPage = () => {
  const workoutId = Number(useParams().workoutId)
  const { search } = useLocation()
  const workout = useWorkout(workoutId)
  // Правки уходят через офлайн-очередь: список показывает их сразу, не дожидаясь сервера
  const queued = useQueuedWorkout(workout.data)
  const [editing, setEditing] = useState<EditingSet | null>(null)

  return (
    <Screen
      header={
        <TopBar
          // Правку открывают со страницы тренировки в посещениях — туда и возвращаемся
          back={`${buildPath(ROUTES.STATS_WORKOUT, { workoutId })}${search}`}
          title={workout.data?.complexName ?? 'Тренировка'}
          subtitle={workout.data ? `исправление · ${formatDate(workout.data.date, 'd MMMM yyyy')}` : 'исправление'}
        />
      }
      className='gap-8 pb-10'
    >
      <QueryScreen query={workout}>
        {() => (
          <>
            <Text
              size='sm'
              tone='muted'
              className='px-gutter'
            >
              Нажми на карандаш, чтобы исправить или удалить подход, на корзину — чтобы убрать упражнение. Забытый
              подход допиши под списком, забытое упражнение — в самом низу.
            </Text>
            {queued.workout?.exercises.map((item, i, all) => (
              <ScreenSection
                key={item.id}
                title={item.name}
                aside={item.superset !== null ? `суперсет ${supersetLabels(all)[i]}` : undefined}
                // Последнее не убрать: пустая тренировка — это удаление тренировки целиком
                action={all.length > 1 && <RemoveItemButton item={item} />}
              >
                <SetList
                  item={item}
                  onEdit={setEditing}
                  live={false}
                />
                <AddSetForm item={item} />
              </ScreenSection>
            ))}
            <div className='px-gutter'>
              <ButtonLink
                to={`${buildPath(ROUTES.WORKOUT_EDIT_ADD, { workoutId })}${search}`}
                variant='outline'
                className='w-full'
              >
                <PlusIcon />
                Добавить упражнение
              </ButtonLink>
            </div>
          </>
        )}
      </QueryScreen>
      <EditSetSheet
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </Screen>
  )
}

export default WorkoutEditPage
