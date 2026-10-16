import { TrophyIcon } from 'lucide-react'

import type { WorkoutRecordResponseDto } from '@/shared/api/generated/model'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'

const amount = (value: number, unit: WorkoutRecordResponseDto['unit']) =>
  `${value.toLocaleString('ru-RU')} ${unit === 'kg' ? 'кг' : 'повт.'}`

type WorkoutRecordsProps = {
  records: WorkoutRecordResponseDto[]
  /** Сколько показать; остальное — подписью «ещё N» */
  limit?: number
}

// Личные рекорды тренировки: лучший подход сегодня против прежнего лучшего
export const WorkoutRecords = ({ records, limit }: WorkoutRecordsProps) => {
  const shown = limit ? records.slice(0, limit) : records
  const rest = records.length - shown.length

  return (
    <div>
      <List>
      {shown.map(r => (
        <ListRow
          key={r.exerciseId}
          lead={<TrophyIcon className='size-4' />}
          title={r.name}
          meta={`было ${amount(r.previous, r.unit)}`}
          trail={
            <Poster
              as='span'
              size='lg'
              tone='primary'
              numeric
            >
              {amount(r.value, r.unit)}
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
