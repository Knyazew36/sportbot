import { useState } from 'react'
import { useParams } from 'react-router'

import { useQueuedWorkout, useWorkout, type WorkoutSet } from '@/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { EditSetSheet } from '@/widgets/workout/EditSetSheet'
import { SetList } from '@/widgets/workout/SetList'

import { AddSetForm } from './components/AddSetForm'

// Исправление прошедшей тренировки из статистики: вес, повторы, лишние и забытые подходы.
// Графики и нагрузка по мышцам пересчитываются сами — бэк считает их по подходам
const WorkoutEditPage = () => {
  const workoutId = Number(useParams().workoutId)
  const workout = useWorkout(workoutId)
  // Правки уходят через офлайн-очередь: список показывает их сразу, не дожидаясь сервера
  const queued = useQueuedWorkout(workout.data)
  const [editing, setEditing] = useState<WorkoutSet | null>(null)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.STATS}
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
            {queued.workout?.exercises.map(item => (
              <ScreenSection
                key={item.id}
                title={item.name}
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
        set={editing}
        onClose={() => setEditing(null)}
      />
    </Screen>
  )
}

export default WorkoutEditPage
