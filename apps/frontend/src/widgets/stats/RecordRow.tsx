import { TrophyIcon } from 'lucide-react'
import { Link } from 'react-router'

import { setText, type StatsRecord } from '@sportbot/api/entities/stats'
import { formatDate } from '@/shared/lib/format'
import { ListRow } from '@/shared/ui/kit/ListRow'
import { Poster } from '@/shared/ui/kit/Typography'

type RecordRowProps = { record: StatsRecord; to: string }

// Личный рекорд: новый лучший подход против прежнего. Строка ведёт на прогресс упражнения
export const RecordRow = ({ record, to }: RecordRowProps) => (
  <ListRow
    className='relative'
    lead={<TrophyIcon className='text-sb-gold size-4' />}
    title={
      <Link
        to={to}
        className='underline-offset-4 after:absolute after:inset-0 hover:underline'
      >
        {record.name}
      </Link>
    }
    meta={`${formatDate(record.date, 'd MMM')} · было ${setText(record.previous, record.unit)}`}
    trail={
      <Poster
        as='span'
        size='sm'
        tone='primary'
        numeric
      >
        {setText(record.set, record.unit)}
      </Poster>
    }
  />
)
