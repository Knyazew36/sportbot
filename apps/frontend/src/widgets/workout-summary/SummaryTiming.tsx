import type { WorkoutSummary } from '@/entities/workout'
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster } from '@/shared/ui/kit/Typography'

type Timing = NonNullable<WorkoutSummary['timing']>

const restMeta = (timing: Timing): string | undefined => {
  if (!timing.restCount) return undefined
  const average = `в среднем ${formatSeconds(Math.round(timing.restSeconds / timing.restCount))}`
  if (!timing.restTargetSeconds) return average
  const over = timing.restPlannedActualSeconds - timing.restTargetSeconds
  return `${average} · ${over > 0 ? `сверх плана ${formatSeconds(over)}` : 'в рамках плана'}`
}

// Куда ушло время: разминка до первого подхода, дальше только работа и отдых — третьего на тренировке нет.
// Нулевые строки не показываем, кроме работы — она главная
export const SummaryTiming = ({ timing }: { timing: Timing }) => {
  const rows = [
    { title: 'Разминка', meta: undefined, seconds: timing.warmupSeconds, show: timing.warmupSeconds > 0 },
    { title: 'Работа', meta: 'чистое время подходов', seconds: timing.workSeconds, show: true },
    { title: 'Отдых', meta: restMeta(timing), seconds: timing.restSeconds, show: timing.restCount > 0 },
    { title: 'Заминка', meta: undefined, seconds: timing.cooldownSeconds ?? 0, show: timing.cooldownSeconds !== null },
  ].filter(r => r.show)

  return (
    <ScreenSection title='Время'>
      <List>
        {rows.map(r => (
          <ListRow
            key={r.title}
            title={r.title}
            meta={r.meta}
            trail={
              <Poster
                as='span'
                size='sm'
                numeric
              >
                {formatSeconds(r.seconds)}
              </Poster>
            }
          />
        ))}
      </List>
    </ScreenSection>
  )
}
