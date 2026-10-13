import { ArrowRightIcon, BellOffIcon, CheckIcon, ShuffleIcon, TriangleAlertIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { useState } from 'react'

import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { BarbellArt, MedalArt } from '@/shared/ui/kit/Art'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { plan, programs, today } from './model/mock'

type DayState = 'training' | 'rest' | 'done' | 'pause'

const STATES: { key: DayState; label: string }[] = [
  { key: 'training', label: 'Тренировка' },
  { key: 'rest', label: 'Отдых' },
  { key: 'done', label: 'Засчитано' },
  { key: 'pause', label: 'Пауза' },
]

// ── Общие куски ─────────────────────────────────────────────────────────────

const PermissionBanner = () => (
  <button
    type='button'
    className='border-border hover:bg-accent flex w-full items-center gap-3 border-b-[1.5px] px-5 py-3 text-left transition-colors'
  >
    <BellOffIcon
      className='text-primary size-4 shrink-0'
      aria-hidden
    />
    <Text
      as='span'
      size='xs'
      tone='soft'
      className='flex-1'
    >
      Бот не сможет задавать вопросы и напоминать —{' '}
      <span className='text-primary underline underline-offset-2'>разрешить</span>
    </Text>
  </button>
)

const WEEK_CELL: Record<(typeof today.week)[number]['state'], string> = {
  done: 'bg-primary border-primary text-primary-foreground',
  today: 'border-primary text-primary border-2',
  plan: 'border-foreground/25 text-foreground/60',
  rest: 'border-transparent text-foreground/30',
}

const Streak = () => (
  <Rise className='border-foreground/80 mx-5 border-[1.5px]'>
    <div className='flex items-stretch'>
      <div className='border-foreground/80 flex w-[min(132px,34vw)] shrink-0 flex-col justify-between gap-2 border-r-[1.5px] p-3'>
        <Eyebrow>Серия</Eyebrow>
        <Poster
          as='span'
          size='5xl'
          numeric
          tone='primary'
        >
          {today.streak.current}
        </Poster>
      </div>
      <div className='flex flex-1 flex-col justify-between gap-3 p-3'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-2'>
          <Text as='span'>дней подряд</Text>
          <Eyebrow>рекорд {today.streak.record}</Eyebrow>
        </div>
        {/* До рекорда — дорожка, заполненная растром */}
        <div className='border-border relative h-3 border-[1.5px]'>
          <motion.div
            className='sb-halftone bg-accent absolute inset-y-0 left-0'
            initial={{ width: 0 }}
            animate={{ width: `${(today.streak.current / today.streak.record) * 100}%` }}
            transition={{ delay: 0.4, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
      </div>
    </div>
    {/* Неделя на всю ширину блока: в узкой колонке клетки сжимались до нечитаемых */}
    <ol className='border-foreground/80 grid grid-cols-7 gap-1.5 border-t-[1.5px] p-3'>
      {today.week.map(d => (
        <li
          key={d.day}
          className={cn('flex h-9 items-center justify-center border-[1.5px] text-[13px]', WEEK_CELL[d.state])}
          title={d.state}
        >
          {d.state === 'done' ? (
            <CheckIcon
              className='size-4'
              strokeWidth={3}
            />
          ) : (
            d.day
          )}
        </li>
      ))}
    </ol>
  </Rise>
)

// ── Тренировочный день ──────────────────────────────────────────────────────

const activeProgram = programs.find(p => p.active)!

// «Другой комплекс»: до начала тренировки любой комплекс активной программы вместо предложенного (frontend-tz, 8.5)
const OtherComplexSheet = ({
  open,
  onOpenChange,
  current,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: number
  onPick: (id: number) => void
}) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>Другой комплекс</SheetTitle>
        <SheetDescription>{activeProgram.title}. Очередь продолжится с выбранного.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-2 px-5 pb-6'>
        {activeProgram.complexes.map(c => (
          <OptionButton
            key={c.id}
            mark={c.letter}
            title={c.title}
            meta={`${c.exercises.length} упр.${c.id === activeProgram.nextComplexId ? ' · на очереди' : ''}`}
            selected={c.id === current}
            onClick={() => {
              onPick(c.id)
              onOpenChange(false)
            }}
          />
        ))}
      </div>
    </SheetContent>
  </Sheet>
)

const TrainingDay = () => {
  const [complexId, setComplexId] = useState(activeProgram.nextComplexId)
  const [otherOpen, setOtherOpen] = useState(false)
  const complex = activeProgram.complexes.find(c => c.id === complexId)!
  const exercisesOfDay = complex.id === activeProgram.nextComplexId ? plan : complex.exercises
  const sets = exercisesOfDay.reduce((sum, e) => sum + e.sets, 0)
  // Плакат: первое слово комплекса огромным кеглем, остальное строкой ниже
  const [head, ...tail] = complex.title.split(' ')
  const byRotation = complex.id === activeProgram.nextComplexId

  return (
    <>
      <Rise className='relative px-5'>
        <Eyebrow as='p'>
          Комплекс {complex.letter} · {activeProgram.title}
        </Eyebrow>
        <Lead className='mt-4'>{byRotation ? 'сегодня на очереди —' : 'сегодня вне очереди —'}</Lead>
        <Poster
          as='h1'
          size='hero'
          tone='primary'
          fit
          className='mt-1'
        >
          {head}
        </Poster>
        {tail.length > 0 && (
          <Poster
            size='3xl'
            className='mt-2'
          >
            {tail.join(' ')}
          </Poster>
        )}
        <BarbellArt className='-mx-5 mt-2 w-[calc(100%+2.5rem)]' />
        <StatGrid
          className='mt-1'
          items={[
            { label: 'упражнений', value: exercisesOfDay.length },
            { label: 'подходов', value: sets },
            { label: 'минут', value: `~${today.durationMin}` },
          ]}
        />
      </Rise>

      <Streak />

      <ScreenSection
        title='Очередь комплексов'
        aside={byRotation ? 'следующий подсвечен' : 'выбран вручную'}
        bleed
      >
        <ol className='no-scrollbar flex gap-2 overflow-x-auto px-5'>
          {activeProgram.complexes.map(c => (
            <li key={c.id}>
              <Ticket
                mark={c.letter}
                title={c.title}
                active={c.id === complexId}
              />
            </li>
          ))}
        </ol>
      </ScreenSection>

      <ScreenSection
        title='Состав'
        aside={`${exercisesOfDay.length} упр.`}
      >
        <List>
          {exercisesOfDay.map((e, i) => (
            <ListRow
              key={e.id}
              lead={String(i + 1).padStart(2, '0')}
              title={e.name}
              meta={e.muscles}
              trail={
                <Poster
                  as='span'
                  className='whitespace-nowrap'
                >
                  {e.sets} × {e.reps}
                </Poster>
              }
            >
              {'warning' in e && e.warning && (
                <Button
                  variant='alert'
                  size='sm'
                  className='mt-2 h-auto py-1.5 text-[12.5px]'
                >
                  <TriangleAlertIcon
                    className='size-3.5'
                    aria-hidden
                  />
                  {e.warning}
                </Button>
              )}
            </ListRow>
          ))}
        </List>
      </ScreenSection>

      {/* Подписи переносятся: на 320px две кнопки в строку не влезают в одну линию */}
      <Rise className='grid grid-cols-2 gap-2 px-5'>
        <Button
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
          onClick={() => setOtherOpen(true)}
        >
          <ShuffleIcon />
          Другой комплекс
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='h-auto min-h-9 min-w-0 px-2 py-1.5 leading-tight whitespace-normal'
        >
          Сегодня не буду
        </Button>
      </Rise>

      <OtherComplexSheet
        open={otherOpen}
        onOpenChange={setOtherOpen}
        current={complexId}
        onPick={setComplexId}
      />
    </>
  )
}

// ── Другие состояния дня ────────────────────────────────────────────────────

const RestDay = () => (
  <>
    <Rise className='px-5'>
      <Lead>сегодня —</Lead>
      <Poster
        as='h1'
        size='hero'
        tone='primary'
        fit
      >
        отдых
      </Poster>
      <div className='sb-lanes mt-4 h-24 opacity-40' />
    </Rise>
    <Streak />
    <Rise className='px-5'>
      <List>
        <ListRow
          title='Грудь и трицепс'
          meta='Следующий на очереди'
          trail={
            <Poster
              as='span'
              size='2xl'
              tone='faint'
            >
              A
            </Poster>
          }
        />
      </List>
    </Rise>
    <Rise className='px-5'>
      <ButtonLink
        to={ROUTES.PREVIEW_WORKOUT}
        variant='outline'
        className='w-full'
      >
        Всё равно потренироваться
      </ButtonLink>
    </Rise>
  </>
)

const DoneDay = () => (
  <>
    <Rise className='relative mx-auto w-[200px]'>
      <MedalArt />
      <Poster
        as='span'
        size='5xl'
        tone='primary'
        className='absolute inset-x-0 top-[52%] text-center'
      >
        13
      </Poster>
    </Rise>
    <Rise className='px-5 text-center'>
      <Eyebrow
        as='p'
        tone='primary'
      >
        Тренировка засчитана ✅
      </Eyebrow>
      <Poster
        as='h1'
        size='4xl'
        className='mt-3'
      >
        13 дней
        <br />
        подряд
      </Poster>
      <Lead
        size='md'
        tone='soft'
        className='mt-3'
      >
        до рекорда осталось восемь
      </Lead>
    </Rise>
  </>
)

const PauseDay = () => (
  <>
    <Rise className='px-5'>
      <Eyebrow as='p'>Бот молчит, серия сохранена</Eyebrow>
      <Poster
        as='h1'
        size='display'
        tone='primary'
        className='mt-4'
      >
        на
        <br />
        паузе
      </Poster>
      <Lead
        size='xl'
        className='mt-3'
      >
        до 20 октября
      </Lead>
    </Rise>
    <Rise className='hatch border-border mx-5 h-28 border-[1.5px] opacity-60' />
    <Rise className='px-5'>
      <Button className='w-full'>Снять паузу</Button>
    </Rise>
  </>
)

const FOOTER: Partial<Record<DayState, { label: string; to: string }>> = {
  training: { label: 'Начать', to: ROUTES.PREVIEW_WORKOUT },
  done: { label: 'Заминка', to: ROUTES.PREVIEW_COOLDOWN },
}

const TodayScreen = () => {
  const [state, setState] = useState<DayState>('training')
  const cta = FOOTER[state]

  return (
    <Screen
      key={state}
      header={
        <>
          <ScreenHeader
            title={`${today.weekday} · ${today.date}`}
            aside={
              <>
                день{' '}
                <Poster
                  as='span'
                  size='xs'
                  tone='default'
                  className='tracking-normal'
                >
                  {today.dayNumber}
                </Poster>
              </>
            }
          />
          {state === 'training' && <PermissionBanner />}
          {/* Переключатель только для превью: показать состояния дня из frontend-tz, раздел 7 */}
          <div className='no-scrollbar flex items-center gap-2 overflow-x-auto px-5 pt-3 pb-1'>
            <Eyebrow className='shrink-0'>превью:</Eyebrow>
            <ToggleGroup
              value={[state]}
              onValueChange={([v]) => v && setState(v as DayState)}
            >
              {STATES.map(s => (
                <ToggleGroupItem
                  key={s.key}
                  value={s.key}
                  size='sm'
                >
                  {s.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </>
      }
      footer={
        cta && (
          <StickyFooter>
            <ButtonLink
              to={cta.to}
              size='xl'
              className='w-full justify-between'
            >
              {cta.label}
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </ButtonLink>
          </StickyFooter>
        )
      }
    >
      {state === 'training' && <TrainingDay />}
      {state === 'rest' && <RestDay />}
      {state === 'done' && <DoneDay />}
      {state === 'pause' && <PauseDay />}
    </Screen>
  )
}

export default TodayScreen
