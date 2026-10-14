import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import {
  type ComplexExerciseValues,
  type ComplexNameValues,
  complexNameSchema,
  type ProgramComplex,
} from '@/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ComplexExerciseRow } from './ComplexExerciseRow'

/** Что страница комплекса умеет с ним делать: программы пользователя (frontend-tz, 10.3) и шаблоны админа (14.2) */
export type ComplexActions = {
  renameComplex: (id: number, name: string) => Promise<unknown>
  /** После удаления страница уводит обратно в программу */
  deleteComplex: (id: number) => Promise<unknown>
  updateExercise: (id: number, plan: ComplexExerciseValues) => Promise<unknown>
  deleteExercise: (id: number) => void
  reorderExercises: (complexId: number, ids: number[]) => void
}

type ComplexEditorProps = {
  complex: ProgramComplex
  actions: ComplexActions
  /** Страница подбора упражнений в этот комплекс */
  addExerciseTo: string
}

type ComplexNameFormProps = { complex: ProgramComplex; onRename: ComplexActions['renameComplex'] }

const ComplexNameForm = ({ complex, onRename }: ComplexNameFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComplexNameValues>({
    resolver: zodResolver(complexNameSchema),
    values: { name: complex.name },
  })

  const save = handleSubmit(({ name }) => {
    if (name === complex.name) return
    return onRename(complex.id, name).catch(error => applyFieldErrors(error, setError))
  })

  return (
    <form onSubmit={save}>
      <TextField
        label='Название комплекса'
        placeholder='Например, «Ноги» или «Верх»'
        error={errors.name}
        {...register('name', { onBlur: () => void save() })}
      />
    </form>
  )
}

// Комплекс целиком: название, упражнения с планом, добавление и удаление. Каждая правка сразу уходит на сервер
export const ComplexEditor = ({ complex, actions, addExerciseTo }: ComplexEditorProps) => {
  const ids = complex.exercises.map(e => e.id)

  const move = (from: number, to: number) => {
    const next = [...ids]
    next.splice(to, 0, ...next.splice(from, 1))
    actions.reorderExercises(complex.id, next)
  }

  return (
    <>
      <Rise className='px-gutter'>
        <ComplexNameForm
          complex={complex}
          onRename={actions.renameComplex}
        />
      </Rise>

      <ScreenSection
        title='Упражнения'
        aside={ids.length > 1 ? 'в порядке выполнения' : undefined}
      >
        {ids.length ? (
          <List>
            {complex.exercises.map((e, i) => (
              <ComplexExerciseRow
                key={e.id}
                exercise={e}
                onMoveUp={i > 0 ? () => move(i, i - 1) : undefined}
                onMoveDown={i < ids.length - 1 ? () => move(i, i + 1) : undefined}
                onPlanChange={plan => actions.updateExercise(e.id, plan)}
                onRemove={() => actions.deleteExercise(e.id)}
              />
            ))}
          </List>
        ) : (
          <Text
            size='sm'
            tone='muted'
          >
            Пока пусто. Добавь упражнения — у каждого задашь подходы и повторы, например 3 × 8–12.
          </Text>
        )}
        <ButtonLink
          to={addExerciseTo}
          variant={ids.length ? 'outline' : 'default'}
          className='w-full'
        >
          <PlusIcon strokeWidth={2.5} />
          Добавить упражнения
        </ButtonLink>
      </ScreenSection>

      <Rise className='px-gutter'>
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              className='w-full'
            />
          }
          title={`Удалить «${complex.name}»?`}
          description='Комплекс пропадёт из очереди. История тренировок по нему сохранится.'
          confirmLabel='Удалить'
          onConfirm={() => actions.deleteComplex(complex.id)}
        >
          <Trash2Icon />
          Удалить комплекс
        </ConfirmAction>
      </Rise>
    </>
  )
}
