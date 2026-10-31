import { useBodyWeightStats } from '@sportbot/api/entities/stats'
import { relativeStrength } from '@sportbot/api/lib/strength'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

/** Вес тела за год: последняя запись нужна, даже если взвешивались давно */
const WEIGHT_DAYS = 365

const ratioText = (ratio: number) => ratio.toLocaleString('ru-RU', { maximumFractionDigits: 2 })

// Сила относительно веса тела: с этим числом сравнивают себя с собой и с нормативами, а не только по килограммам.
// Вес тела — свой и приватный, поэтому у друга блока нет (решает страница)
export const RelativeStrength = ({ e1rm }: { e1rm: number }) => {
  const weights = useBodyWeightStats(WEIGHT_DAYS)
  const bodyWeight = weights.data?.at(-1)?.value
  const ratio = relativeStrength(e1rm, bodyWeight)
  if (ratio == null || bodyWeight == null) return null

  return (
    <Text
      size='sm'
      tone='muted'
      className='mt-3'
    >
      <Eyebrow>Относительно веса тела </Eyebrow>
      <Poster
        as='span'
        size='sm'
        tone='primary'
      >
        ×{ratioText(ratio)}
      </Poster>{' '}
      — при {ratioText(bodyWeight)} кг
    </Text>
  )
}
