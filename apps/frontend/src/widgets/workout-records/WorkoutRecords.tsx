import { TrophyIcon } from 'lucide-react'

import type { WorkoutRecordResponseDto } from '@sportbot/api/generated/model'
import { durationText } from '@sportbot/api/lib/measure'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'

// У веса рядом повторы: рекорд бывает и на том же весе — больше повторов
const amount = (value: number, unit: WorkoutRecordResponseDto['unit'], reps: number) =>
  unit === 'sec'
    ? durationText(value)
    : unit === 'kg'
      ? `${value.toLocaleString('ru-RU')} кг × ${reps}`
      : `${value.toLocaleString('ru-RU')} ${unit === 'min' ? 'мин' : 'повт.'}`

type WorkoutRecordsProps = {
  records: WorkoutRecordResponseDto[]
  /** Рекорд тоннажа тренировки — первой строкой; tonnage — сколько поднято сегодня */
  tonnageRecord?: { tonnage: number; previous: number } | null
  /** Сколько показать; остальное — подписью «ещё N» */
  limit?: number
}

// Личные рекорды тренировки: лучший подход сегодня против прежнего лучшего
export const WorkoutRecords = ({ records, tonnageRecord, limit }: WorkoutRecordsProps) => {
  const shown = limit ? records.slice(0, limit) : records
  const rest = records.length - shown.length

  return (
    <div>
      <List>
      {tonnageRecord && (
        <ListRow
          lead={<TrophyIcon className='text-sb-gold size-4' />}
          title='Поднято за тренировку'
          meta={`было ${tonnageRecord.previous.toLocaleString('ru-RU')} кг`}
          trail={
            <Poster
              as='span'
              size='lg'
              tone='primary'
              numeric
            >
              {tonnageRecord.tonnage.toLocaleString('ru-RU')} кг
            </Poster>
          }
        />
      )}
      {shown.map(r => (
        <ListRow
          key={r.exerciseId}
          lead={<TrophyIcon className='text-sb-gold size-4' />}
          title={r.name}
          meta={`было ${amount(r.previous, r.unit, r.previousReps)}`}
          trail={
            <Poster
              as='span'
              size='lg'
              tone='primary'
              numeric
            >
              {amount(r.value, r.unit, r.reps)}
            </Poster>
          }
        />
      ))}
      </List>
      {rest > 0 && (
        <Text
          size='sm'
          tone='soft'
          className='mt-2'
        >
          и ещё {rest} — в итоге тренировки
        </Text>
      )}
    </div>
  )
}
