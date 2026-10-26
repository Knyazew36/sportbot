import { zodResolver } from '@hookform/resolvers/zod'
import { Link2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Reorder } from 'motion/react'
import { useForm } from 'react-hook-form'

import { useState } from 'react'

import {
  type ComplexExerciseValues,
  complexNameSchema,
  type ComplexNameValues,
  type ProgramComplex,
  toBlocks,
  withSupersetTarget,
} from '@sportbot/api/entities/program'
import { applyFieldErrors } from '@/shared/lib/form'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { TextField } from '@/shared/ui/kit/TextField'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Label } from '@/shared/ui/shadcn/label'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

import { ComplexExerciseRow } from './ComplexExerciseRow'
import { SupersetBlock } from './SupersetBlock'

/** Что страница комплекса умеет с ним делать: программы пользователя (frontend-tz, 10.3) и шаблоны админа (14.2) */
export type ComplexActions = {
  renameComplex: (id: number, name: string) => Promise<unknown>
  /** null — как в профиле, 0 — без разминки */
  setWarmup: (id: number, warmupMinutes: number | null) => Promise<unknown>
  /** После удаления страница уводит обратно в программу */
  deleteComplex: (id: number) => Promise<unknown>
  updateExercise: (id: number, plan: ComplexExerciseValues) => Promise<unknown>
  deleteExercise: (id: number) => void
  reorderExercises: (complexId: number, ids: number[]) => void
  ungroupExercise: (id: number) => void
  ungroupSuperset: (complexId: number, superset: number) => void
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
        label='Название тренировки'
        placeholder='Например, «Ноги» или «Верх»'
        error={errors.name}
        {...register('name', { onBlur: () => void save() })}
      />
    </form>
  )
}

// «Профиль», а не «Как в профиле»: пять сегментов на 375px длинную подпись не вмещают
const WARMUP = [
  { value: '0', label: 'Нет' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' },
]

type ComplexWarmupProps = { complex: ProgramComplex; onChange: ComplexActions['setWarmup'] }

const ComplexWarmup = ({ complex, onChange }: ComplexWarmupProps) => (
  <div className='flex flex-col gap-2'>
    <Label>Разминка, мин</Label>
    <Segmented
      options={WARMUP}
      // null (как в профиле) выбором больше не задаётся: с «Профилем» сегменты не влезали в ширину
      value={complex.warmupMinutes === null ? '' : String(complex.warmupMinutes)}
      onValueChange={v => void onChange(complex.id, Number(v))}
      size='default'
      stretch
    />
  </div>
)

// Комплекс целиком: название, упражнения с планом, добавление и удаление. Каждая правка сразу уходит на сервер
export const ComplexEditor = ({ complex, actions, addExerciseTo }: ComplexEditorProps) => {
  // Порядок блоков под пальцем: на сервер уходит один раз, когда блок отпустили.
  // Суперсет тянется целиком, поэтому двигаем блоки, а серверу отдаём плоский список
  const [dragOrder, setDragOrder] = useState<string[] | null>(null)
  // Упражнение, открытое в шторке: посмотреть технику, не уходя из редактора
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null)
  const blocks = toBlocks(complex.exercises)
  const at = new Map(dragOrder?.map((key, i) => [key, i]))
  const shown = dragOrder ? [...blocks].sort((a, b) => (at.get(a.key) ?? 0) - (at.get(b.key) ?? 0)) : blocks
  const ids = complex.exercises.map(e => e.id)

  const save = (next: number[]) => {
    if (next.some((id, i) => id !== ids[i])) actions.reorderExercises(complex.id, next)
  }

  const drop = () => {
    if (!dragOrder) return
    save(shown.flatMap(b => b.items.map(e => e.id)))
    setDragOrder(null)
  }

  // Новый порядок внутри суперсета встаёт на место его участников
  const reorderInside = (blockKey: string, inside: number[]) =>
    save(shown.flatMap(b => (b.key === blockKey ? inside : b.items.map(e => e.id))))

  return (
    <>
      <Rise className='px-gutter'>
        <ComplexNameForm
          complex={complex}
          onRename={actions.renameComplex}
        />
      </Rise>

      <Rise className='px-gutter'>
        <ComplexWarmup
          complex={complex}
          onChange={actions.setWarmup}
        />
      </Rise>

      <ScreenSection
        title='Упражнения'
        aside={ids.length > 1 ? 'порядок — тяни за ручку' : undefined}
      >
        {ids.length ? (
          <Reorder.Group
            as='ol'
            axis='y'
            values={shown.map(b => b.key)}
            onReorder={setDragOrder}
            className='border-border border-t-[1.5px]'
          >
            {shown.map(block => {
              const { superset } = block
              if (superset !== null)
                return (
                  <SupersetBlock
                    key={block.key}
                    block={{ ...block, superset }}
                    onDrop={drop}
                    onReorder={inside => reorderInside(block.key, inside)}
                    onPlanChange={actions.updateExercise}
                    onRemove={actions.deleteExercise}
                    onUngroupExercise={actions.ungroupExercise}
                    onUngroup={() => actions.ungroupSuperset(complex.id, superset)}
                    addTo={withSupersetTarget(addExerciseTo, { joinItemId: block.items[0]!.id })}
                  />
                )
              const e = block.items[0]!
              return (
                <ComplexExerciseRow
                  key={block.key}
                  value={block.key}
                  exercise={e}
                  onDrop={drop}
                  onPlanChange={plan => actions.updateExercise(e.id, plan)}
                  onRemove={() => actions.deleteExercise(e.id)}
                  onView={() => setOpened({ id: e.exerciseId, name: e.name })}
                  supersetTo={withSupersetTarget(addExerciseTo, { joinItemId: e.id })}
                />
              )
            })}
          </Reorder.Group>
        ) : (
          <Text
            size='sm'
            tone='muted'
          >
            Пока пусто. Добавь упражнения — у каждого задашь подходы и повторы, например 3 × 8–12.
          </Text>
        )}
        <div className='flex gap-2'>
          <ButtonLink
            to={addExerciseTo}
            variant={ids.length ? 'outline' : 'default'}
            className='flex-1'
          >
            <PlusIcon strokeWidth={2.5} />
            Упражнения
          </ButtonLink>
          <ButtonLink
            to={withSupersetTarget(addExerciseTo, { newSuperset: true })}
            variant='outline'
            className='shrink-0'
          >
            <Link2Icon />
            Суперсет
          </ButtonLink>
        </div>
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
          description='Тренировка пропадёт из очереди. История по ней сохранится.'
          confirmLabel='Удалить'
          onConfirm={() => actions.deleteComplex(complex.id)}
        >
          <Trash2Icon />
          Удалить тренировку
        </ConfirmAction>
      </Rise>

      <ExerciseSheet
        exercise={opened}
        onOpenChange={open => !open && setOpened(null)}
      />
    </>
  )
}
