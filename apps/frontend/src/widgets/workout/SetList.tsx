import {
  lastSetHint,
  lastSetText,
  restText,
  weightText,
  type WorkoutItem,
  type WorkoutSet,
} from '@sportbot/api/entities/workout'
import { clockText, isTimed, type Measure } from '@sportbot/api/lib/measure'
import { ArrowDownIcon, ArrowUpIcon, ClockIcon, PencilIcon, PlusIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Rise } from '@/shared/ui/kit/Reveal'
import { BlockHeading } from '@/shared/ui/kit/ScreenSection'
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

type SetDetailsProps = {
  item: WorkoutItem
  set: WorkoutSet
}

type SetRestProps = SetDetailsProps & {
  live: boolean
}

// Строка между плитками: отдых идёт между подходами, а не внутри них
const SetRest = ({ item, set, live }: SetRestProps) => {
  const rest = set.restBeforeSeconds
  // В прошедшей тренировке «прошлый раз» может оказаться ей самой — сравниваем только в идущей
  const previous = live ? (lastSetHint(item.last, set.number)?.restBeforeSeconds ?? null) : null
  if (rest === null && previous === null) return null
  const target = rest === null ? null : set.restTargetSeconds
  const over = rest !== null && target !== null && rest > target
  return (
    <div
      data-rest
      className='flex'
    >
      {/* Линия от номера к номеру: подходы читаются одной цепочкой. Над первым подходом соединять не с чем */}
      <div className='flex w-10 shrink-0 justify-center'>
        <div className='bg-border w-[1.5px] in-[li:first-child]:hidden' />
      </div>
      <div className='flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 px-3 py-2.5'>
        <Eyebrow>Отдых</Eyebrow>
        {rest !== null && (
          <Poster
            as='span'
            size='xs'
            tone={over ? 'danger' : 'inherit'}
            className='tabular-nums'
          >
            {restText(rest)}
          </Poster>
        )}
        {target !== null && (
          <Text
            as='span'
            size='xs'
            tone='muted'
            className='tabular-nums'
          >
            план {restText(target)}
          </Text>
        )}
        {previous !== null && (
          <Text
            as='span'
            size='xs'
            tone='muted'
            className='tabular-nums'
          >
            было {restText(previous)}
          </Text>
        )}
      </div>
    </div>
  )
}

type SetCompareProps = {
  now: number
  before: number
  /** Значение прошлого раза строкой */
  text: string
}

// Значение прошлого раза под текущим. Стрелка — куда сдвинулись; без изменений её нет
const SetCompare = ({ now, before, text }: SetCompareProps) => (
  <div className='flex min-w-0 items-center gap-1'>
    <Text
      size='xs'
      tone='muted'
      className='truncate tabular-nums'
    >
      было {text}
    </Text>
    {now > before && (
      <ArrowUpIcon
        className='text-positive size-3.5 shrink-0'
        strokeWidth={3}
        aria-label='больше, чем в прошлый раз'
      />
    )}
    {now < before && (
      <ArrowDownIcon
        className='text-destructive size-3.5 shrink-0'
        strokeWidth={3}
        aria-label='меньше, чем в прошлый раз'
      />
    )}
  </div>
)

// Тот же подход в прошлый раз — вторым рядом сетки, под своими колонками
const SetPrevious = ({ item, set }: SetDetailsProps) => {
  const previous = lastSetHint(item.last, set.number)
  if (!previous) return null
  if (isTimed(item.measure)) {
    return (
      <SetCompare
        now={set.reps}
        before={previous.reps}
        text={lastSetText(previous, item.measure)}
      />
    )
  }
  return (
    <>
      <SetCompare
        now={set.weight}
        before={previous.weight}
        text={previous.weight === 0 ? 'свой вес' : `${weightText(previous.weight)} кг`}
      />
      <SetCompare
        now={set.reps}
        before={previous.reps}
        text={`${previous.reps} раз`}
      />
    </>
  )
}

// Подвал плитки: сколько длился подход.
// У упражнения на время длительность и есть главное значение плитки — второй раз не повторяем
const SetDuration = ({ item, set }: SetDetailsProps) => {
  if (isTimed(item.measure) || set.workSeconds === null) return null
  return (
    <div className='border-border flex items-baseline gap-3 border-t-[1.5px] px-3 py-1.5'>
      <Eyebrow>Работа</Eyebrow>
      <Poster
        as='span'
        size='xs'
        className='tabular-nums'
      >
        {clockText(set.workSeconds)}
      </Poster>
    </div>
  )
}

// Сохранённые подходы упражнения: плитки подходов, между ними строки отдыха. Подходов может быть больше или меньше плана.
// У упражнения на время одна колонка — время подхода, веса нет. Единицы стоят при числах, поэтому шапка колонок не нужна
export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => {
  const timed = isTimed(item.measure)
  return (
    // Плитки тяжелее справки над ними: без воздуха сверху блоки слипаются. Подходов нет — отделять нечего
    <Rise className={cn(item.sets.length > 0 && 'mt-20')}>
      {item.sets.length > 0 && (
        <div className='mb-3'>
          <BlockHeading
            title='Подходы'
            aside={live ? `${item.sets.length} из ${item.plannedSets}` : undefined}
          />
        </div>
      )}
      {item.sets.length ? (
        <ol>
          {item.sets.map(set => (
            // У подхода из очереди серверного id ещё нет
            <li
              key={set.clientId ?? set.id}
              className='not-first:mt-3 has-[[data-rest]]:mt-0'
            >
              <SetRest
                item={item}
                set={set}
                live={live}
              />
              <div className='border-border flex border-[1.5px]'>
                <Poster
                  as='span'
                  size='md'
                  tone='faint'
                  className='border-border flex w-[37px] shrink-0 items-center justify-center border-r-[1.5px]'
                >
                  {set.number}
                </Poster>
                <div className='relative min-w-0 flex-1'>
                  <div className={cn('grid gap-x-2 gap-y-1.5 py-3 pl-3', timed ? 'pr-12' : 'grid-cols-2 pr-2')}>
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
                    {/* В прошедшей тренировке «прошлый раз» может оказаться ей самой — сравниваем только в идущей */}
                    {live && (
                      <SetPrevious
                        item={item}
                        set={set}
                      />
                    )}
                  </div>
                  {/* Вне сетки: «было» под повторами занимает всю ширину колонки, под кнопку её не отдаём */}
                  <Button
                    variant='outline'
                    size='icon-xs'
                    className='absolute top-2 right-2'
                    onClick={() => onEdit({ set, measure: item.measure })}
                    aria-label={`Исправить подход ${set.number}`}
                  >
                    <PencilIcon />
                  </Button>
                  <SetDuration
                    item={item}
                    set={set}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        !live && (
          <Text
            size='sm'
            tone='muted'
            className='py-4'
          >
            Подходов не записано.
          </Text>
        )
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
          Добавить подход вручную
        </Button>
      )}
    </Rise>
  )
}
