import { Navigate, useNavigate } from 'react-router'

import { useState } from 'react'

import { useAddItems, useCurrentWorkout } from '@sportbot/api/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { local } from '@/shared/lib/storage'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker'

// Силы остались — ещё упражнения в идущую тренировку. Добавлять можно только до «Завершить»:
// завершение двигает очередь программы и собирает заминку по мышцам тренировки
const AddWorkoutExercisePage = () => {
  const navigate = useNavigate()
  const current = useCurrentWorkout()
  const add = useAddItems()
  // Выбранные в подборе ждут ответа «только сегодня или в комплекс»
  const [picked, setPicked] = useState<number[] | null>(null)

  const workout = current.data?.workout
  if (current.isSuccess && !workout)
    return (
      <Navigate
        to={ROUTES.TODAY}
        replace
      />
    )

  const apply = (inComplex: boolean) => {
    if (!workout || !picked) return
    const before = new Set(workout.exercises.map(e => e.id))
    void add.mutateAsync({ workoutId: workout.id, exerciseIds: picked, inComplex }).then(next => {
      // Экран тренировки откроется сразу на первом добавленном, а не на последнем открытом
      const added = next.exercises.find(e => !before.has(e.id))
      if (added) local.set(`workout-picked-${workout.id}`, String(added.id))
      navigate(ROUTES.WORKOUT, { replace: true })
    })
  }

  return (
    <>
      <ExercisePicker
        presentIds={workout?.exercises.map(e => e.exerciseId) ?? []}
        subtitle='в сегодняшнюю тренировку'
        back={ROUTES.WORKOUT}
        adding={add.isPending}
        onAdd={setPicked}
      />

      <Sheet
        open={picked !== null}
        onOpenChange={open => {
          if (!open) setPicked(null)
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Куда добавить</SheetTitle>
            <SheetDescription>
              {workout?.complexId
                ? `Только в эту тренировку или ещё и в конец «${workout.complexName}» — тогда будет и в следующий раз.`
                : 'Встанет в конец сегодняшней тренировки.'}
            </SheetDescription>
          </SheetHeader>
          <div className='px-gutter flex flex-col gap-3 pb-6'>
            <Button
              size='lg'
              className='w-full'
              disabled={add.isPending}
              onClick={() => apply(false)}
            >
              Только сегодня
            </Button>
            {!!workout?.complexId && (
              <Button
                variant='outline'
                size='lg'
                className='w-full'
                disabled={add.isPending}
                onClick={() => apply(true)}
              >
                И в комплекс
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default AddWorkoutExercisePage
