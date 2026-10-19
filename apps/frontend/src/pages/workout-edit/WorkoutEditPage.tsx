import { useState } from 'react'
import { useLocation, useParams } from 'react-router'

import { useQueuedWorkout, useWorkout } from '@/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { supersetLabels } from '@/shared/lib/superset'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { type EditingSet, EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { AddSetForm } from './components/AddSetForm'

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
              Нажми на карандаш, чтобы исправить или удалить подход. Забытый подход допиши под списком.
            </Text>
            {queued.workout?.exercises.map((item, i, all) => (
              <ScreenSection
                key={item.id}
                title={item.name}
                aside={item.superset !== null ? `суперсет ${supersetLabels(all)[i]}` : undefined}
              >
                <SetList
                  item={item}
                  onEdit={setEditing}
                  live={false}
                />
                <AddSetForm item={item} />
              </ScreenSection>
            ))}
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
