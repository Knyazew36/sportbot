import { PencilIcon } from 'lucide-react'

import { weightText, type WorkoutItem, type WorkoutSet } from '@/entities/workout'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type SetListProps = { item: WorkoutItem; onEdit: (set: WorkoutSet) => void }

// Сохранённые подходы упражнения; новый вводится в панели внизу. Подходов может быть больше или меньше плана
export const SetList = ({ item, onEdit }: SetListProps) => (
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
            key={set.id}
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
        {/* Следующий подход — тот, что сейчас вводится в панели внизу */}
        <li className='border-primary bg-accent -mx-2 grid grid-cols-[32px_1fr] items-center border-b-[1.5px] px-2 py-3'>
          <Poster
            as='span'
            size='sm'
            tone='primary'
          >
            {item.sets.length + 1}
          </Poster>
          <Text
            as='span'
            size='sm'
            tone='primary'
          >
            вводим внизу ↓
          </Text>
        </li>
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
  </Rise>
)
