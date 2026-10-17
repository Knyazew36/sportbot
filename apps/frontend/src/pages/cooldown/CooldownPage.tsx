import { ArrowRightIcon, ListIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'

import { useEffect, useRef, useState } from 'react'

import { stretchGuide } from '@/entities/catalog/lib'
import { type Cooldown, useCooldown, useCooldownFinish, useCooldownStart } from '@/entities/workout'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { timerEndSignal } from '@/shared/lib/signal'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { HoldControls } from '@/widgets/catalog/HoldControls'

import { SideTrack } from './components/SideTrack'
import { StretchListSheet } from './components/StretchListSheet'

type Phase = { kind: 'overview' } | { kind: 'step'; index: number; side: 1 | 2 } | { kind: 'more' } | { kind: 'done' }

// Заминка тренировки (frontend-tz, 9): состав и порядок — с сервера, при повторном открытии не меняется.
// В статистику идёт только время заминки: начало первой растяжки и выход на «Готово»
// start — пришли с предложения после финиша: список уже не показываем, сразу первая растяжка
const CooldownView = ({ cooldown, start }: { cooldown: Cooldown; start: boolean }) => {
  const [phase, setPhase] = useState<Phase>(start ? { kind: 'step', index: 0, side: 1 } : { kind: 'overview' })
  const [listOpen, setListOpen] = useState(false)
  const all = [...cooldown.main, ...cooldown.optional]
  const back = buildPath(ROUTES.WORKOUT_SUMMARY, { workoutId: cooldown.workoutId })
  const { mutate: markStart } = useCooldownStart()
  const { mutate: markFinish } = useCooldownFinish()
  const marked = useRef<{ start?: boolean; finish?: boolean }>({})

  // Отметка один раз за открытие; повторное открытие сервер не перезапишет
  useEffect(() => {
    if (phase.kind === 'step' && !marked.current.start) {
      marked.current.start = true
      markStart(cooldown.workoutId)
    }
    if (phase.kind === 'done' && marked.current.start && !marked.current.finish) {
      marked.current.finish = true
      markFinish(cooldown.workoutId)
    }
  }, [phase.kind, cooldown.workoutId, markStart, markFinish])

  const go = (index: number) => setPhase({ kind: 'step', index, side: 1 })

  const next = () => {
    if (phase.kind !== 'step') return
    const stretch = all[phase.index]!
    if (stretch.perSide && phase.side === 1) return setPhase({ ...phase, side: 2 })
    // После основного блока — вопрос, хватит ли времени на остальное (frontend-tz, 9.1)
    if (phase.index === cooldown.main.length - 1 && cooldown.optional.length) return setPhase({ kind: 'more' })
    if (phase.index < all.length - 1) return go(phase.index + 1)
    setPhase({ kind: 'done' })
  }

  const prev = () => {
    if (phase.kind !== 'step') return
    if (phase.side === 2) return setPhase({ ...phase, side: 1 })
    if (phase.index > 0) go(phase.index - 1)
  }

  const listSheet = (
    <StretchListSheet
      open={listOpen}
      onOpenChange={setListOpen}
      main={cooldown.main}
      optional={cooldown.optional}
      minutes={cooldown.minutes}
      current={phase.kind === 'step' ? phase.index : null}
      onPick={go}
    />
  )

  if (!all.length)
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title='Заминка'
          />
        }
        className='px-gutter'
      >
        <Rise>
          <Lead>растяжек под эту тренировку —</Lead>
          <Poster
            as='h1'
            size='display'
            tone='primary'
          >
            нет
          </Poster>
          <Lead
            size='md'
            tone='soft'
            className='mt-3'
          >
            В справочнике пока нет растяжек на мышцы, которые работали.
          </Lead>
        </Rise>
      </Screen>
    )

  if (phase.kind === 'overview')
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title='Заминка'
            subtitle={`~${cooldown.minutes} мин`}
          />
        }
        footer={
          <StickyFooter>
            <ButtonLink
              to={back}
              variant='outline'
              size='lg'
            >
              Пропустить
            </ButtonLink>
            <Button
              size='lg'
              onClick={() => go(0)}
            >
              Начать
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </Button>
          </StickyFooter>
        }
        className='px-gutter'
      >
        <Rise>
          <Lead>растяжка на отработавшие мышцы —</Lead>
          <Poster
            as='h1'
            size='display'
            tone='primary'
            numeric
          >
            ~{cooldown.minutes} мин
          </Poster>
        </Rise>
        {[
          { title: 'Основной блок', list: cooldown.main },
          { title: 'Если есть время', list: cooldown.optional },
        ]
          .filter(b => b.list.length)
          .map(block => (
            <ScreenSection
              key={block.title}
              title={block.title}
              aside={pluralize(block.list.length, ['растяжка', 'растяжки', 'растяжек'])}
            >
              <List>
                {block.list.map(s => (
                  <CatalogRow
                    key={s.id}
                    name={s.name}
                    imageUrl={toAssetUrl(s.imageUrl) ?? null}
                    meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                  />
                ))}
              </List>
            </ScreenSection>
          ))}
      </Screen>
    )

  if (phase.kind === 'more' || phase.kind === 'done')
    return (
      <Screen
        header={
          <TopBar
            back={back}
            title='Заминка'
            subtitle={phase.kind === 'done' ? 'готово' : 'основной блок пройден'}
          />
        }
        footer={
          <StickyFooter>
            {phase.kind === 'more' ? (
              <>
                <Button
                  variant='outline'
                  size='lg'
                  onClick={() => setPhase({ kind: 'done' })}
                >
                  Нет
                </Button>
                <Button
                  size='lg'
                  onClick={() => go(cooldown.main.length)}
                >
                  Да
                </Button>
              </>
            ) : (
              <ButtonLink
                to={back}
                replace
                size='lg'
              >
                К итогу тренировки
                <ArrowRightIcon
                  className='size-7'
                  strokeWidth={2.5}
                />
              </ButtonLink>
            )}
          </StickyFooter>
        }
        className='px-gutter'
      >
        <Rise className='flex flex-1 flex-col justify-center'>
          <Lead>{phase.kind === 'more' ? 'есть время ещё —' : 'растянулись —'}</Lead>
          <Poster
            as='h1'
            size='display'
            tone='primary'
            className='mt-1'
          >
            {phase.kind === 'more' ? `на ${cooldown.optionalMinutes} мин?` : 'Готово'}
          </Poster>
          <div className='sb-lanes mt-6 h-20 opacity-30' />
        </Rise>
        {listSheet}
      </Screen>
    )

  const stretch = all[phase.index]!
  const { steps } = stretchGuide(stretch)
  const inMain = phase.index < cooldown.main.length
  const isLast =
    (phase.index === all.length - 1 || (inMain && phase.index === cooldown.main.length - 1)) &&
    (!stretch.perSide || phase.side === 2)

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={`screen-${phase.index}-${phase.side}`}
        header={
          <>
            <TopBar
              back={back}
              title='Заминка'
              subtitle={`растяжка ${phase.index + 1} из ${all.length} · ~${cooldown.minutes} мин`}
              action={
                <div className='flex items-center gap-2'>
                  <Button
                    variant='alert'
                    size='icon'
                    onClick={() => setListOpen(true)}
                    aria-label='Весь список'
                  >
                    <ListIcon className='size-5' />
                  </Button>
                  {/* Заминка не влияет на засчитывание — выйти можно в любой момент без подтверждения */}
                  <Button
                    variant='destructive'
                    size='sm'
                    className='h-10'
                    onClick={() => setPhase({ kind: 'done' })}
                  >
                    Завершить
                  </Button>
                </div>
              }
            />
            {/* Пройденные и текущая залиты, «если есть время» — пунктиром */}
            <div className='flex gap-1 px-gutter pt-3'>
              {all.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    'h-1 flex-1',
                    i <= phase.index
                      ? 'bg-primary'
                      : i < cooldown.main.length
                        ? 'bg-border'
                        : 'border-border border-t-2 border-dashed',
                  )}
                />
              ))}
            </div>
          </>
        }
        className='gap-5 px-gutter pt-4'
      >
        <Rise className='[@media(max-height:620px)]:hidden'>
          <CatalogImage
            src={toAssetUrl(stretch.imageUrl) ?? null}
            alt={stretch.name}
            size='cover'
            className='aspect-[16/10] max-h-[30svh]'
          />
        </Rise>
        <Rise>
          <Eyebrow
            as='p'
            tone='primary'
          >
            {inMain ? 'Основной блок' : 'Если есть время'} · {stretch.muscles}
          </Eyebrow>
          <Poster
            as='h1'
            size='2xl'
            className='mt-2 hyphens-auto'
          >
            {stretch.name}
          </Poster>
        </Rise>
        {stretch.perSide && (
          <Rise>
            <SideTrack side={phase.side} />
          </Rise>
        )}
        {steps.length > 0 && (
          <Rise>
            <StepList
              items={steps}
              size='lg'
            />
          </Rise>
        )}
      </Screen>

      {/* Ключи соседей разные: одинаковые сломали бы сверку React и старый экран оставался бы рядом с новым */}
      <HoldControls
        key={`hold-${phase.index}-${phase.side}`}
        holdSeconds={stretch.holdSeconds}
        side={stretch.perSide ? phase.side : undefined}
        back={{ label: 'Назад', icon: SkipBackIcon, onClick: prev }}
        next={{
          label: stretch.perSide && phase.side === 1 ? 'Левая' : isLast ? 'Готово' : 'Дальше',
          icon: SkipForwardIcon,
          onClick: next,
        }}
        // Без автоперехода: следующую растяжку человек открывает сам, когда прочитал и готов
        onEnd={() => timerEndSignal(cooldown)}
      />
      {listSheet}
    </div>
  )
}

const CooldownPage = () => {
  const workoutId = Number(useParams().workoutId)
  const [params] = useSearchParams()
  const cooldown = useCooldown(workoutId)
  return (
    <QueryScreen query={cooldown}>
      {data => (
        <CooldownView
          cooldown={data}
          start={params.has('start')}
        />
      )}
    </QueryScreen>
  )
}

export default CooldownPage
