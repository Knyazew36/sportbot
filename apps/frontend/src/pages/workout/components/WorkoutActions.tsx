import {
  ArrowRightIcon,
  ClipboardPenIcon,
  FlameIcon,
  PlayIcon,
  PlusIcon,
  SkipForwardIcon,
  TimerIcon,
} from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { Digits } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export type NextMode = 'skip' | 'next' | 'finish'

type WorkoutActionsProps = {
  /** План по подходам выполнен — главным становится переход дальше */
  planDone: boolean
  /** null — переходить некуда: единственное упражнение без подходов */
  next: NextMode | null
  nextPending: boolean
  /** Отдых вручную — когда он не стартует сам после подхода; null — кнопки нет */
  restSeconds: number | null
  /** Отдых свёрнут к экрану упражнения: пока остаток > 0, кнопка отдыха стоит вместо подхода; null — отдых не идёт */
  restLeft?: number | null
  /** Развернуть свёрнутый отдых обратно на весь экран */
  onRestOpen?: () => void
  /** Разминка свёрнута к экрану упражнения: остаток на кнопке рядом с подходом; null — разминки нет */
  warmupLeft?: number | null
  /** Развернуть свёрнутую разминку обратно на весь экран */
  onWarmupOpen?: () => void
  /** Суперсет: номер следующего круга; null — суперсет закончен, круг не начать */
  round?: number | null
  /** Записать круг без секундомера — сразу шторка ввода */
  onRecordRound?: () => void
  onStartSet: () => void
  onRest: () => void
  onNext: () => void
}

export const NEXT_LABEL: Record<NextMode, string> = {
  skip: 'Следующее упражнение',
  next: 'Следующее упражнение',
  finish: 'Завершить тренировку',
}

// Низ экрана упражнения: подход и переход дальше. Переход всегда активен и подписан тем, что сделает
export const WorkoutActions = ({
  planDone,
  next,
  nextPending,
  restSeconds,
  restLeft = null,
  round,
  onRecordRound,
  onStartSet,
  onRest,
  onRestOpen,
  warmupLeft = null,
  onWarmupOpen,
  onNext,
}: WorkoutActionsProps) => {
  const superset = round !== undefined
  // Свёрнутый отдых ещё идёт — вместо подхода кнопка отдыха с остатком, тап разворачивает его.
  // Время вышло — снова обычная кнопка подхода
  const resting = restLeft !== null && restLeft > 0
  const restBack = resting && (
    <Button
      variant='rest'
      size='lg'
      className='min-w-0 flex-1 shrink'
      onClick={onRestOpen}
    >
      <TimerIcon className='size-6' />
      Отдых
      {/* Без ячеек Digits: в кнопке они разводили цифры слишком широко. Ширина рамки постоянная — подпись не прыгает */}
      <span className='inline-block w-[2.3em] text-left'>{formatSeconds(restLeft)}</span>
    </Button>
  )
  // Ручной старт отдыха — когда он не стартует сам и сейчас не идёт.
  // Всегда своей строкой во всю ширину, как переход дальше: значком в ряду круга он терялся
  const restButton = restLeft === null && restSeconds !== null && (
    <Button
      variant='outline'
      size='lg'
      className='w-full'
      onClick={onRest}
      aria-label='Начать отдых'
    >
      <TimerIcon className='size-6' />
      Отдых
      <Digits>{formatSeconds(restSeconds)}</Digits>
    </Button>
  )
  // Под подходом, а не вместо: начать подход после разминки — главное действие, разминку он и закончит.
  // Отдельной строкой: в одном ряду с подходом время разминки не влезало и ряд разъезжался
  const warmupBack = warmupLeft !== null && (
    <Button
      variant='rest'
      size='lg'
      className='w-full'
      onClick={onWarmupOpen}
      aria-label='Вернуться к разминке'
    >
      <FlameIcon className='size-6' />
      Разминка
      <span className='inline-block w-[2.3em] text-left'>{formatSeconds(warmupLeft)}</span>
    </Button>
  )
  const start = superset ? (
    round !== null && (
      // На 360px «Начать круг» и «Записать» с подписями не влезали и давали боковой скролл — «Записать» значком
      <div className='flex flex-col gap-3'>
        <div className='flex gap-3'>
        {restBack || (
          <Button
            size='lg'
            className='min-w-0 flex-1 shrink'
            onClick={onStartSet}
          >
            <PlayIcon className='size-6' />
            Начать круг {round}
          </Button>
        )}
        <Button
          variant='outline'
          size='lg'
          onClick={onRecordRound}
          aria-label='Записать круг без секундомера'
        >
          <ClipboardPenIcon className='size-5' />
        </Button>
        </div>
        {restButton}
      </div>
    )
  ) : (
    // Ручной отдых отдельной строкой: в одном ряду с подходом кнопка подхода сжималась
    <div className='flex flex-col gap-3'>
      {restBack || (
        // План выполнен — подход не главный: лишний подход только осознанно, а не по привычке нажать синюю
        <Button
          variant={planDone ? 'outline' : 'default'}
          size='lg'
          className='w-full'
          onClick={onStartSet}
        >
          {planDone ? <PlusIcon strokeWidth={3} /> : <PlayIcon className='size-6' />}
          {planDone ? 'Ещё подход' : 'Начать подход'}
        </Button>
      )}
      {restButton}
    </div>
  )

  const forward = next && (
    <Button
      variant={next === 'finish' ? 'success' : next === 'next' && planDone ? 'ink' : 'outline'}
      size='lg'
      className='w-full justify-between'
      onClick={onNext}
      disabled={nextPending}
    >
      {/* Капсом «Следующее упражнение» шире узкого экрана — переносим на вторую строку, а не режем */}
      <span className='text-left leading-[1.1] whitespace-normal'>{NEXT_LABEL[next]}</span>
      {next === 'skip' ? (
        <SkipForwardIcon className='size-6' />
      ) : (
        <ArrowRightIcon
          className='size-6'
          strokeWidth={2.5}
        />
      )}
    </Button>
  )

  // Всё сделано, а силы остались — ещё упражнение до завершения, пока тренировка открыта
  const more = next === 'finish' && (
    <ButtonLink
      to={ROUTES.WORKOUT_ADD}
      variant='outline'
      size='lg'
      className='w-full'
    >
      <PlusIcon strokeWidth={3} />
      Ещё упражнение
    </ButtonLink>
  )

  return (
    <StickyFooter className='flex flex-col items-stretch gap-3'>
      {planDone ? forward : start}
      {!planDone && warmupBack}
      {planDone ? start : forward}
      {planDone && warmupBack}
      {more}
    </StickyFooter>
  )
}
