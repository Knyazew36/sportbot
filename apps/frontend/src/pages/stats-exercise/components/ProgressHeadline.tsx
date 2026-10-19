import { deltaText, setText, type StatsProgress, type StatsProgressItem } from '@/entities/stats'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

const STATUS: Record<StatsProgressItem['status'], string | null> = {
  growing: null,
  flat: 'без роста',
  stalled: 'стоит 3 недели',
  idle: null,
}

type Point = StatsProgress['points'][number]

/** Лучший подход: больше вес, при равном весе — больше повторов (как на бэке) */
const topOf = (points: Point[]) =>
  points.reduce((top, p) => (p.weight !== top.weight ? (p.weight > top.weight ? p : top) : p.reps > top.reps ? p : top))

type ProgressHeadlineProps = {
  summary: StatsProgressItem
  /** Точки выбранного периода */
  points: Point[]
  /** «за 3 месяца» */
  periodText: string
}

// Шапка упражнения: лучший подход за период крупно и рост за период. В периоде не делали — лучший за всё время
export const ProgressHeadline = ({ summary, points, periodText }: ProgressHeadlineProps) => {
  const best = points.length ? topOf(points) : summary.best
  const delta = deltaText(summary.delta, summary.deltaUnit)
  const status = STATUS[summary.status]

  return (
    <ScreenSection>
      <Eyebrow as='p'>{points.length ? `Лучший подход ${periodText}` : 'Лучший подход за всё время'}</Eyebrow>
      <Poster
        size='3xl'
        numeric
        fit
      >
        {setText(best, summary.unit)}
      </Poster>
      <div>
          {delta ? (
            <Poster
              size='sm'
              tone='primary'
              numeric
            >
              {delta} {periodText}
            </Poster>
          ) : (
            <Text
              size='sm'
              tone='muted'
            >
              {points.length ? `${periodText} ${status ?? 'без роста'}` : `${periodText} не делали`}
            </Text>
          )}
          {delta && status && (
            <Text
              size='sm'
              tone='muted'
            >
              {status}
            </Text>
          )}
      </div>
    </ScreenSection>
  )
}
