import { ClockIcon, PencilIcon, PlusIcon } from 'lucide-react'

import { weightText, type WorkoutItem, type WorkoutSet } from '@/entities/workout'
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import { clockText, isTimed, type Measure } from '@/shared/lib/measure'
import { cn } from '@/shared/lib/utils'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type SetListProps = {
  item: WorkoutItem
  /** Мера нужна шторке правки: у упражнения на время правится время */
  onEdit: (editing: { set: WorkoutSet; measure: Measure }) => void
  /** Идущая тренировка: подсказка, с чего начать. В прошедшей подход добавляется формой под списком */
  live?: boolean
  /** Записать подход без таймера; нет — кнопки под списком нет */
  onAdd?: () => void
}

// Время подхода и отдых перед ним. Отдых сверх плана выделен: видно, где пересидел
const SetTiming = ({ set }: { set: WorkoutSet }) => {
  const rest = set.restBeforeSeconds
  if (set.workSeconds === null && rest === null) return null
  // План показываем, только когда пересидел
  const target = rest !== null && set.restTargetSeconds !== null && rest > set.restTargetSeconds ? set.restTargetSeconds : null
  return (
    <Text
      size='xs'
      tone='muted'
      className='col-span-3 col-start-2 mt-1.5 tabular-nums'
    >
      {set.workSeconds !== null && formatSeconds(set.workSeconds)}
      {set.workSeconds !== null && rest !== null && ' · '}
      {rest !== null && (
        <Text
          as='span'
          size='xs'
          tone={target !== null ? 'danger' : 'muted'}
        >
          отдых {formatSeconds(rest)}
          {target !== null && ` из ${formatSeconds(target)}`}
        </Text>
      )}
    </Text>
  )
}

// Сохранённые подходы упражнения. Подходов может быть больше или меньше плана.
// У упражнения на время одна колонка — время подхода, веса нет
export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => {
  const timed = isTimed(item.measure)
  const grid = timed ? 'grid-cols-[32px_1fr_40px]' : 'grid-cols-[32px_1fr_1fr_40px]'
  return (
  <Rise>
    <div className={cn('border-border grid border-b-[1.5px] pb-2', grid)}>
      <Eyebrow tone='faint'>№</Eyebrow>
      {timed ? (
        <Eyebrow tone='faint'>Время</Eyebrow>
      ) : (
        <>
          <Eyebrow tone='faint'>Вес</Eyebrow>
          <Eyebrow tone='faint'>Повторы</Eyebrow>
        </>
      )}
    </div>
    {item.sets.length ? (
      <ol>
        {item.sets.map(set => (
          <li
            // У подхода из очереди серверного id ещё нет
            key={set.clientId ?? set.id}
            className={cn('border-border grid items-center border-b-[1.5px] py-3', grid)}
          >
            <Poster
              as='span'
              size='sm'
              tone='faint'
            >
              {set.number}
            </Poster>
            {!timed && (
              <Poster
                as='span'
                size='xl'
              >
                {weightText(set.weight)}
                {set.weight > 0 && <Unit>кг</Unit>}
              </Poster>
            )}
            <Poster
              as='span'
              size='xl'
              numeric={timed}
            >
              {timed ? clockText(set.reps) : set.reps}
              <Unit>{timed ? 'мин:с' : 'раз'}</Unit>
              {/* Тихая метка вместо бейджа: подход сохранён на телефоне и уйдёт, когда появится сеть */}
              {set.pending && (
                <ClockIcon
                  className='text-muted-foreground ml-1.5 inline size-3.5 align-baseline'
                  aria-label='ждёт отправки'
                />
              )}
            </Poster>
            <Button
              variant='outline'
              size='icon-sm'
              onClick={() => onEdit({ set, measure: item.measure })}
              aria-label={`Исправить подход ${set.number}`}
            >
              <PencilIcon />
            </Button>
            <SetTiming set={set} />
          </li>
        ))}
      </ol>
    ) : (
      <Text
        size='sm'
        tone='muted'
        className='py-4'
      >
        {live ? 'Подходов ещё нет — жми «Начать подход».' : 'Подходов не записано.'}
      </Text>
    )}
    {onAdd && (
      // Обводка и малый размер: запись без таймера — запасной путь, главный остаётся «Начать подход»
      <Button
        variant='outline'
        size='sm'
        className='mt-4 w-full'
        onClick={onAdd}
      >
        <PlusIcon strokeWidth={3} />
        Добавить подход
      </Button>
    )}
  </Rise>
  )
}
