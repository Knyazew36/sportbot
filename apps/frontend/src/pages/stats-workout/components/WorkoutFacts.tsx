import { pluralize } from '@front-cmdt/utils/pluralize'
import { PencilIcon } from 'lucide-react'

import { type WorkoutSummary } from '@sportbot/api/entities/workout'
import { EXERCISE_FORMS, SET_FORMS } from '@/shared/lib/plural-forms'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'


type WorkoutFactsProps = {
  summary: WorkoutSummary
  /** Правка подходов; те же day/month — правка вернёт сюда же */
  editTo: string
}

// Цифры тренировки: подходы, упражнения, минуты, тоннаж, кардио и вход в правку подходов
export const WorkoutFacts = ({ summary: s, editTo }: WorkoutFactsProps) => (
  <Rise className='px-gutter flex flex-col gap-3'>
    <StatGrid
      framed
      items={[
        { label: pluralize(s.sets, SET_FORMS, { withCount: false }), value: s.sets },
        {
          label: pluralize(s.exercisesTotal, EXERCISE_FORMS, { withCount: false }),
          value: `${s.exercisesDone}/${s.exercisesTotal}`,
        },
        { label: 'минут', value: s.minutes },
      ]}
    />
    {s.tonnage > 0 && (
      <Text
        size='sm'
        tone='soft'
      >
        Поднято за тренировку: {s.tonnage.toLocaleString('ru-RU')} кг
      </Text>
    )}
    {s.cardioName && (
      <Text
        size='sm'
        tone='soft'
      >
        Кардио в конце: {s.cardioName}
        {s.cardioMinutes ? `, ${s.cardioMinutes} мин` : ''}
      </Text>
    )}
    {/* Подходы есть — их можно поправить; в простом режиме править нечего */}
    {s.sets > 0 && (
      <ButtonLink
        to={editTo}
        variant='outline'
        className='w-full'
      >
        <PencilIcon />
        Исправить подходы
      </ButtonLink>
    )}
  </Rise>
)
