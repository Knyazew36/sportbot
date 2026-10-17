import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  RepeatIcon,
  TimerIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { useCountdown } from '@/shared/lib/hooks/use-countdown'
import { cn } from '@/shared/lib/utils'
import { BoxInput } from '@/shared/ui/kit/BoxInput'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Ring } from '@/shared/ui/kit/Ring'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { exercises } from './model/catalog'
import { plan, workout } from './model/mock'
import { useTrainingSettings } from './model/preview-settings'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_OF_FORMS } from '@/shared/lib/plural-forms'

type WorkoutSet = (typeof workout.sets)[number]

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Карточка справочника для «Техники»: в превью план связан со справочником по названию
const catalogIdOf = (name: string) =>
  exercises.find(e => e.name.startsWith(name.split(' ').slice(0, 3).join(' ')))?.id ?? 2

// ── Лента упражнений ────────────────────────────────────────────────────────

// Как беговые дорожки: сделано залито, текущее в синем контуре. Порядок не обязателен — можно перейти к любому
const Lanes = ({ done, current, onPick }: { done: number[]; current: number; onPick: (index: number) => void }) => (
  <ol className='grid grid-cols-6 gap-1 px-gutter pt-3'>
    {plan.map((e, i) => {
      const isDone = done.includes(i)
      const isCurrent = current === i
      return (
        <li key={e.id}>
          <Button
            variant={isDone ? 'default' : isCurrent ? 'alert' : 'outline'}
            size='sm'
            onClick={() => onPick(i)}
            className={cn(
              'h-8 w-full justify-between px-1.5',
              isCurrent && 'border-2',
              !isDone && !isCurrent && 'text-foreground/45',
            )}
            aria-label={`${e.name}${isDone ? ', сделано' : ''}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <Poster
              as='span'
              size='xs'
            >
              {i + 1}
            </Poster>
            {isDone && (
              <CheckIcon
                className='size-3'
                strokeWidth={3}
              />
            )}
          </Button>
        </li>
      )
    })}
  </ol>
)

// ── Подходы ─────────────────────────────────────────────────────────────────

const SetRow = ({ set, onEdit }: { set: WorkoutSet; onEdit: () => void }) =>
  set.saved ? (
    <li className='border-border grid grid-cols-[32px_1fr_1fr_40px] items-center border-b-[1.5px] py-3'>
      <Poster
        as='span'
        size='sm'
        tone='faint'
      >
        {set.n}
      </Poster>
      <Poster
        as='span'
        size='xl'
      >
        {set.weight}
        <Unit>кг</Unit>
      </Poster>
      <Poster
        as='span'
        size='xl'
      >
        {set.reps}
        <Unit>раз</Unit>
      </Poster>
      <Button
        variant='outline'
        size='icon-sm'
        onClick={onEdit}
        aria-label={`Исправить подход ${set.n}`}
      >
        <PencilIcon />
      </Button>
    </li>
  ) : (
    // Сам ввод живёт в липкой панели снизу, здесь только метка места в списке
    <li className='border-primary grid grid-cols-[32px_1fr] items-center border-b-2 py-3'>
      <Poster
        as='span'
        size='sm'
        tone='primary'
      >
        {set.n}
      </Poster>
      <Eyebrow tone='primary'>вводится ниже ↓</Eyebrow>
    </li>
  )

// Исправить или удалить сохранённый подход — пока тренировка не завершена (frontend-tz, 8.2)
const EditSetSheet = ({ set, onClose }: { set: WorkoutSet | null; onClose: () => void }) => (
  <Sheet
    open={set != null}
    onOpenChange={open => !open && onClose()}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Подход {set?.n}</SheetTitle>
        <SheetDescription>Исправь вес или повторы.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-3 px-gutter pb-6'>
        <div className='grid grid-cols-2 gap-2'>
          <BoxInput
            label='вес, кг'
            defaultValue={set?.weight}
          />
          <BoxInput
            label='повторы'
            defaultValue={set?.reps}
          />
        </div>
        <Button
          size='lg'
          className='w-full'
          onClick={onClose}
        >
          Сохранить
        </Button>
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              className='w-full'
            />
          }
          title={`Удалить подход ${set?.n}?`}
          confirmLabel='Удалить'
          onConfirm={onClose}
        >
          <Trash2Icon />
          Удалить подход
        </ConfirmAction>
      </div>
    </SheetContent>
  </Sheet>
)

const CurrentSet = ({ set }: { set: WorkoutSet }) => (
  <div className='border-primary relative border-t-2 bg-[color-mix(in_oklab,var(--sb-blue)_9%,var(--sb-paper))] px-gutter pt-2.5 pb-3'>
    <div className='flex items-baseline justify-between'>
      <Eyebrow tone='primary'>Подход {set.n}</Eyebrow>
      <Eyebrow>прошлый раз {set.last}</Eyebrow>
    </div>
    {/* Поля открываются пустыми, прошлое значение — только подсказкой */}
    <div className='mt-2 grid grid-cols-[1fr_1fr_auto] gap-2'>
      <BoxInput
        label='вес, кг'
        placeholder='22'
      />
      <BoxInput
        label='повторы'
        placeholder='8'
      />
      <Button className='h-auto gap-1.5 px-3.5'>
        <CheckIcon
          className='size-5'
          strokeWidth={3}
        />
        Готово
      </Button>
    </div>
  </div>
)

// ── Таймер отдыха ───────────────────────────────────────────────────────────

const RestTimer = ({ total }: { total: number }) => {
  const [left, setLeft] = useCountdown(Math.min(72, total))
  const over = left <= 0

  return (
    <>
      <div className='flex items-center gap-4 px-gutter pt-4'>
        <div className='relative shrink-0'>
          <Ring
            value={Math.max(left, 0) / total}
            size={132}
            stroke={5}
            track='color-mix(in oklab, var(--sb-paper) 22%, transparent)'
            className='h-auto w-[min(132px,18svh)]'
          />
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <TimerIcon className='text-primary size-4' />
            <Eyebrow
              size='sm'
              tone='inverseMuted'
              className='mt-1'
            >
              отдых
            </Eyebrow>
          </div>
        </div>
        <div className='min-w-0 flex-1'>
          {over ? (
            <>
              <Eyebrow
                as='p'
                tone='primary'
              >
                Отдых закончился
              </Eyebrow>
              <Poster
                size='2xl'
                className='mt-1'
              >
                Вперёд
              </Poster>
            </>
          ) : (
            <>
              <Eyebrow
                as='p'
                tone='inverseMuted'
              >
                до подхода 3
              </Eyebrow>
              <Poster
                size='5xl'
                numeric
                className='mt-1 text-[min(76px,11svh,17vw)]'
              >
                {fmt(left)}
              </Poster>
            </>
          )}
        </div>
      </div>
      <div className='grid grid-cols-2 gap-3 px-gutter pt-4'>
        <Button
          variant='paper'
          onClick={() => setLeft(v => Math.max(v, 0) + 30)}
        >
          <PlusIcon strokeWidth={3} />
          30 с
        </Button>
        <Button
          variant='paper'
          onClick={() => setLeft(0)}
        >
          Пропустить
        </Button>
      </div>
    </>
  )
}

const RestPanel = () => {
  const { showRestTimer, autoStartRest, restSeconds } = useTrainingSettings()
  // Без автостарта таймер ждёт кнопку «Отдых» (frontend-tz, 8.3)
  const [started, setStarted] = useState(autoStartRest)
  const current = workout.sets.find(s => !s.saved)

  return (
    <motion.section
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 28, delay: 0.35 }}
      className='sticky bottom-0 z-30 mt-auto'
    >
      {/* Ввод подхода прибит к таймеру, чтобы не искать его прокруткой между подходами */}
      {current && <CurrentSet set={current} />}
      {/* Таймер можно выключить в профиле: тогда внизу остаётся только ввод подхода */}
      {showRestTimer && (
        <InkPanel className='pb-[max(1rem,var(--sb-bottom-inset))]'>
          {started ? (
            <RestTimer total={Number(restSeconds)} />
          ) : (
            <div className='px-gutter pt-4'>
              <Button
                variant='paper'
                size='lg'
                className='w-full justify-between'
                onClick={() => setStarted(true)}
              >
                <span className='flex items-center gap-2'>
                  <TimerIcon className='size-5' />
                  Отдых
                </span>
                <span className='tabular-nums'>{fmt(Number(restSeconds))}</span>
              </Button>
            </div>
          )}
        </InkPanel>
      )}
    </motion.section>
  )
}

// ── Экран ───────────────────────────────────────────────────────────────────

const WorkoutScreen = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [current, setCurrent] = useState(workout.current)
  const [done, setDone] = useState<number[]>(workout.done)
  const [editing, setEditing] = useState<WorkoutSet | null>(null)

  // После замены (8.4) на этом месте аналог: план тот же, истории по нему ещё нет — «первый раз»
  const replaced = exercises.find(x => String(x.id) === params.get('replaced'))
  const planned = plan[current]!
  const e =
    replaced && current === workout.current
      ? { ...planned, name: replaced.name, last: null, warning: undefined }
      : planned
  const catalogId = replaced && current === workout.current ? replaced.id : catalogIdOf(planned.name)
  const hasSets = current === workout.current

  const finishExercise = () => {
    const nextDone = done.includes(current) ? done : [...done, current]
    setDone(nextDone)
    const next = plan.findIndex((_, i) => !nextDone.includes(i))
    if (next >= 0) setCurrent(next)
  }

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={current}
        header={
          <>
            <TopBar
              back={ROUTES.PREVIEW_TODAY}
              title='Грудь и трицепс'
              subtitle={
                <>
                  упражнение {current + 1} из {plan.length} · <span className='text-primary'>{workout.elapsed}</span>
                </>
              }
              action={
                <ConfirmAction
                  trigger={
                    <Button
                      variant='ink'
                      size='sm'
                    />
                  }
                  title='Завершить тренировку?'
                  description={
                    done.length > 0
                      ? `Сделано ${done.length} из ${pluralize(plan.length, EXERCISE_OF_FORMS)}. Тренировка засчитается.`
                      : 'Ни одно упражнение не отмечено сделанным — тренировка не засчитается.'
                  }
                  confirmLabel='Завершить'
                  confirmVariant='default'
                  onConfirm={() => navigate(ROUTES.PREVIEW_SUMMARY)}
                >
                  Завершить
                </ConfirmAction>
              }
            />
            <Lanes
              done={done}
              current={current}
              onPick={setCurrent}
            />
          </>
        }
        className='gap-6 px-gutter'
      >
        <Rise className='relative'>
          {/* Номер упражнения контуром — как номер на стартовом нагруднике */}
          <Poster
            as='span'
            size='hero'
            numeric
            className='pointer-events-none absolute -top-3 -right-2 text-[min(170px,40vw)] text-transparent opacity-40 select-none'
            style={{ WebkitTextStroke: '1.5px var(--sb-blue)' }}
            aria-hidden
          >
            {String(current + 1).padStart(2, '0')}
          </Poster>
          <Eyebrow
            as='p'
            tone='primary'
            className='relative'
          >
            {done.includes(current) ? 'Сделано' : replaced && hasSets ? 'Замена на сегодня' : 'Текущее'}
          </Eyebrow>
          <Poster
            as='h1'
            size='2xl'
            className='relative mt-3 max-w-[80%] hyphens-auto'
          >
            {e.name}
          </Poster>
          {e.warning && (
            <Button
              variant='alert'
              size='sm'
              className='relative mt-4 h-auto py-1.5 text-[12.5px]'
            >
              <TriangleAlertIcon className='size-3.5' />
              {e.warning}
            </Button>
          )}
        </Rise>

        {/* Справка, а не действие: светлая рамка без тени */}
        <Rise className='border-border grid grid-cols-2 border-[1.5px]'>
          <div className='border-border border-r-[1.5px] p-3'>
            <Eyebrow as='p'>План</Eyebrow>
            <Poster
              size='2xl'
              className='mt-2 text-[min(40px,9vw)] whitespace-nowrap'
            >
              {e.sets} × {e.reps}
            </Poster>
          </div>
          <div className='p-3'>
            <Eyebrow as='p'>Прошлый раз</Eyebrow>
            <Poster
              tone={e.last ? 'primary' : 'faint'}
              className='mt-2'
            >
              {e.last ?? 'первый раз'}
            </Poster>
          </div>
        </Rise>

        <Rise className='flex gap-3'>
          <ButtonLink
            to={`${buildPath(ROUTES.PREVIEW_EXERCISE, { exerciseId: catalogId })}?from=${ROUTES.PREVIEW_WORKOUT}`}
            variant='outline'
            size='sm'
          >
            <BookOpenIcon className='size-3.5' />
            Техника
          </ButtonLink>
          <ButtonLink
            to={ROUTES.PREVIEW_WORKOUT_REPLACE}
            variant='outline'
            size='sm'
          >
            <RepeatIcon className='size-3.5' />
            Заменить
          </ButtonLink>
        </Rise>

        <Rise>
          <div className='border-border grid grid-cols-[32px_1fr_1fr_40px] border-b-[1.5px] pb-2'>
            <Eyebrow tone='faint'>№</Eyebrow>
            <Eyebrow tone='faint'>Вес</Eyebrow>
            <Eyebrow tone='faint'>Повторы</Eyebrow>
          </div>
          {hasSets ? (
            <ol>
              {workout.sets.map(s => (
                <SetRow
                  key={s.n}
                  set={s}
                  onEdit={() => setEditing(s)}
                />
              ))}
            </ol>
          ) : (
            <Text
              size='sm'
              tone='muted'
              className='py-4'
            >
              Подходов ещё нет — первый вводится внизу.
            </Text>
          )}
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
          >
            <PlusIcon strokeWidth={2.5} />
            Ещё подход
          </Button>
        </Rise>

        <Rise>
          <Button
            variant='ink'
            size='lg'
            className='w-full justify-between'
            onClick={finishExercise}
            disabled={done.length === plan.length}
          >
            Упражнение сделано
            <ArrowRightIcon
              className='size-6'
              strokeWidth={2.5}
            />
          </Button>
        </Rise>
      </Screen>
      <RestPanel />
      <EditSetSheet
        set={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  )
}

export default WorkoutScreen
