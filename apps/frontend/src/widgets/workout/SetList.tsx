import { ClockIcon, PencilIcon, PlusIcon } from 'lucide-react'

import { weightText, type WorkoutItem, type WorkoutSet } from '@/entities/workout'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type SetListProps = {
  item: WorkoutItem
  onEdit: (set: WorkoutSet) => void
  /** Идущая тренировка: подсказка, с чего начать. В прошедшей подход добавляется формой под списком */
  live?: boolean
  /** Записать подход без таймера; нет — кнопки под списком нет */
  onAdd?: () => void
}

// Сохранённые подходы упражнения. Подходов может быть больше или меньше плана
export const SetList = ({ item, onEdit, live = true, onAdd }: SetListProps) => (
  <Rise>
    <div className='border-border grid grid-cols-[32px_1fr_1fr_40px] border-b-[1.5px] pb-2'>
      <Eyebrow tone='faint'>№</Eyebrow>
      <Eyebrow tone='faint'>Вес</Eyebrow>
      <Eyebrow tone='faint'>Повторы</Eyebrow>
    </div>
    {item.sets.length ? (
      <ol>
        {item.sets.map(set => (
          <li
            // У подхода из очереди серверного id ещё нет
            key={set.clientId ?? set.id}
            className='border-border grid grid-cols-[32px_1fr_1fr_40px] items-center border-b-[1.5px] py-3'
          >
            <Poster
              as='span'
              size='sm'
              tone='faint'
            >
              {set.number}
            </Poster>
            <Poster
              as='span'
              size='xl'
            >
              {weightText(set.weight)}
              {set.weight > 0 && <Unit>кг</Unit>}
            </Poster>
            <Poster
              as='span'
              size='xl'
            >
              {set.reps}
              <Unit>раз</Unit>
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
              onClick={() => onEdit(set)}
              aria-label={`Исправить подход ${set.number}`}
            >
              <PencilIcon />
            </Button>
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
