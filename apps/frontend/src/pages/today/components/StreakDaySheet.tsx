import { ChevronRightIcon } from 'lucide-react'

import { ShareWorkoutButton } from '@/features/share-workout/ShareWorkoutButton'
import { useStatsDay } from '@/entities/stats'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { DayWorkout } from '@/widgets/stats/DayWorkout'

type StreakDaySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Остаётся заданной и после закрытия, чтобы шторка не опустела на анимации */
  date: string | null
}

// Тренировки дня из серии: что делали, поделиться карточкой и перейти к полной странице с рекордами и правкой
export const StreakDaySheet = ({ open, onOpenChange, date }: StreakDaySheetProps) => {
  const day = useStatsDay(date)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{formatDate(date, 'd MMMM')}</SheetTitle>
          <Eyebrow tone='primary'>{formatDate(date, 'EEEE')}</Eyebrow>
        </SheetHeader>
        <div className='flex min-h-0 flex-col overflow-y-auto pb-5'>
          <QueryScreen
            query={day}
            rows={3}
          >
            {d => (
              <div className='divide-border flex flex-col divide-y-[1.5px]'>
                {d.workouts.map(w => (
                  <div
                    key={w.id}
                    className='px-gutter flex flex-col gap-3 py-4 first:pt-0'
                  >
                    <DayWorkout workout={w} />
                    <div className='grid grid-cols-2 gap-2'>
                      <ShareWorkoutButton
                        workoutId={w.id}
                        size='sm'
                      />
                      <ButtonLink
                        to={buildPath(ROUTES.STATS_WORKOUT, { workoutId: w.id })}
                        variant='outline'
                        size='sm'
                      >
                        Подробнее
                        <ChevronRightIcon strokeWidth={2.5} />
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </QueryScreen>
        </div>
      </SheetContent>
    </Sheet>
  )
}
