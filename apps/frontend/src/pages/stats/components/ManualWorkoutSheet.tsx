import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'

import { complexLetter, type Program, usePrograms, useProgram } from '@sportbot/api/entities/program'
import {
  type ManualWorkoutInput,
  manualWorkoutSchema,
  type ManualWorkoutValues,
  useCreateManualWorkout,
} from '@sportbot/api/entities/workout'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { applyFieldErrors } from '@/shared/lib/form'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { QueryState } from '@/shared/ui/kit/QueryState'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { pluralize } from '@front-cmdt/utils/pluralize'

type ManualWorkoutSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ManualWorkoutForm = ({ program }: { program: Program | null }) => {
  const navigate = useNavigate()
  const create = useCreateManualWorkout()
  const today = format(new Date(), 'yyyy-MM-dd')
  // Пустой комплекс не засчитать: в тренировке не было бы упражнений для подходов
  const complexes = (program?.complexes ?? []).filter(c => c.exercises.length)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ManualWorkoutInput, unknown, ManualWorkoutValues>({
    resolver: zodResolver(manualWorkoutSchema(today)),
    defaultValues: { date: today, complexId: complexes.find(c => c.isNext)?.id ?? complexes[0]?.id },
  })

  if (!complexes.length)
    return (
      <div className='px-gutter flex flex-col gap-4 pb-6'>
        <Text tone='soft'>
          {program
            ? 'В активной программе нет тренировок с упражнениями — добавь их, чтобы было что отметить.'
            : 'Нет активной программы — выбери или собери её, чтобы было из чего выбрать тренировку.'}
        </Text>
        <ButtonLink
          to={ROUTES.PROGRAMS}
          className='w-full'
        >
          К программам
        </ButtonLink>
      </div>
    )

  return (
    // Поля прокручиваются, кнопка закреплена внизу шторки
    <form
      className='flex min-h-0 flex-1 flex-col'
      onSubmit={handleSubmit(values =>
        create
          .mutateAsync(values)
          // Подходы вписываются на экране исправления; «Назад» оттуда ведёт в посещения на месяц тренировки
          .then(workout =>
            navigate(`${buildPath(ROUTES.WORKOUT_EDIT, { workoutId: workout.id })}?month=${values.date.slice(0, 7)}`),
          )
          .catch(error => applyFieldErrors(error, setError)),
      )}
    >
      <div className='px-gutter flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-2'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='manual-workout-date'>День</Label>
          <Input
            id='manual-workout-date'
            type='date'
            max={today}
            aria-invalid={!!errors.date}
            {...register('date')}
          />
          <ErrorText errors={errors.date} />
        </div>
        <div className='flex flex-col gap-2'>
          <Label>Тренировка</Label>
          <Controller
            control={control}
            name='complexId'
            render={({ field }) => (
              <div className='flex flex-col gap-2'>
                {complexes.map(c => (
                  <OptionButton
                    key={c.id}
                    type='button'
                    mark={complexLetter(program!.complexes.indexOf(c))}
                    title={c.name}
                    meta={pluralize(c.exercises.length, EXERCISE_FORMS)}
                    selected={c.id === field.value}
                    onClick={() => field.onChange(c.id)}
                  />
                ))}
              </div>
            )}
          />
          <ErrorText errors={errors.complexId} />
        </div>
      </div>

      <div className='px-gutter pt-2 pb-6'>
        <Button
          type='submit'
          className='w-full'
          disabled={create.isPending}
        >
          Добавить
        </Button>
      </div>
    </form>
  )
}

// Тренировка, которую забыли отметить: день и комплекс, подходы — потом на экране исправления
export const ManualWorkoutSheet = ({ open, onOpenChange }: ManualWorkoutSheetProps) => {
  const programs = usePrograms()
  const activeId = programs.data?.find(p => p.active)?.id
  const program = useProgram(activeId)
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        fullHeight
        className='data-[side=bottom]:max-h-[min(92dvh,var(--sheet-ceiling))]'
      >
        <SheetHeader>
          <SheetTitle>Добавить тренировку</SheetTitle>
          <SheetDescription>
            Засчитается в посещения и серию. Подходы впишешь на следующем шаге — или оставишь пустой.
          </SheetDescription>
        </SheetHeader>
        {open && (
          <QueryState query={programs}>
            {() =>
              // Нет активной программы — запрос её состава выключен, форма покажет подсказку
              activeId == null ? (
                <ManualWorkoutForm program={null} />
              ) : (
                <QueryState query={program}>{p => <ManualWorkoutForm program={p} />}</QueryState>
              )
            }
          </QueryState>
        )}
      </SheetContent>
    </Sheet>
  )
}
