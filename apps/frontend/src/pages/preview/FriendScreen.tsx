import { CheckIcon, CopyIcon, PauseIcon, UserMinusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { ROUTES } from '@/shared/config/paths'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { MonthCalendar } from '@/widgets/stats/MonthCalendar'
import { MuscleLoad } from '@/widgets/stats/MuscleLoad'
import { Attendance, StreakPanel } from '@/widgets/stats/StreakPanel'
import { WeightProgress } from '@/widgets/stats/WeightProgress'

import { calendar, friendProfiles } from './model/mock'

const EXERCISES = [
  { value: 'bench', label: 'Жим штанги лёжа' },
  { value: 'squat', label: 'Приседания со штангой' },
]

// Профиль друга (frontend-tz, 13.6): его статистика и программы строго по таблице видимости —
// без веса тела и ограничений, пауза только статусом
const FriendScreen = () => {
  const { friendId } = useParams()
  const navigate = useNavigate()
  const friend = friendProfiles.find(f => String(f.id) === friendId)
  const [copied, setCopied] = useState<number[]>(friend?.programs.filter(p => p.copied).map(p => p.id) ?? [])

  if (!friend) {
    return (
      <Screen
        header={
          <TopBar
            back={ROUTES.PREVIEW_PROFILE}
            title='Друг'
          />
        }
        className='px-5'
      >
        <ScreenState
          state='empty'
          title='Друг не найден'
          description='Возможно, вы больше не друзья.'
        />
      </Screen>
    )
  }

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PREVIEW_PROFILE}
          title={friend.name}
          subtitle={friend.since}
        />
      }
      className='gap-10'
    >
      <Rise className='px-5'>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          fit
        >
          {friend.name}
        </Poster>
        <div className='mt-3 flex flex-wrap gap-1.5'>
          {friend.pausedUntil ? (
            <Badge variant='outline'>
              <PauseIcon />
              на паузе {friend.pausedUntil}
            </Badge>
          ) : friend.trainedToday ? (
            <Badge>
              <CheckIcon />
              сегодня тренировался
            </Badge>
          ) : (
            <Badge variant='outline'>сегодня ещё не тренировался</Badge>
          )}
        </div>
        {friend.trainedToday && (
          <Text
            tone='soft'
            className='mt-3'
          >
            Сегодня: {friend.trainedToday}
          </Text>
        )}
      </Rise>

      <StreakPanel
        current={friend.streak.current}
        record={friend.streak.record}
      />
      <Attendance
        month={friend.attendance.month}
        week={friend.attendance.week}
        weekNote={friend.attendance.weekNote}
      />

      <ScreenSection
        title='Программы'
        aside='можно забрать себе'
      >
        <List>
          {friend.programs.map(p => {
            const isCopied = copied.includes(p.id)
            return (
              <ListRow
                key={p.id}
                lead={String(p.complexes.length).padStart(2, '0')}
                title={p.title}
                meta={p.complexes.join(' · ')}
                trail={
                  <Button
                    variant={isCopied ? 'outline' : 'default'}
                    size='xs'
                    disabled={isCopied}
                    onClick={() => setCopied(ids => [...ids, p.id])}
                  >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                    {isCopied ? 'У тебя' : 'Себе'}
                  </Button>
                }
              />
            )
          })}
        </List>
        <Text
          size='xs'
          tone='muted'
        >
          Копия живёт у тебя в программах с пометкой «от {friend.name}». Если друг её обновит — предложим обновить и у
          тебя.
        </Text>
      </ScreenSection>

      {friend.weightProgress.length > 0 && (
        <WeightProgress
          exercises={EXERCISES}
          data={friend.weightProgress}
        />
      )}
      {friend.muscles.length > 0 && <MuscleLoad items={friend.muscles} />}
      <MonthCalendar
        month='Октябрь'
        lead={3}
        days={calendar}
      />

      <Rise className='px-5'>
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              className='w-full'
            />
          }
          title={`Удалить ${friend.name} из друзей?`}
          description='Вы перестанете видеть статистику друг друга. Уведомление второй стороне не придёт. Скопированные программы останутся.'
          confirmLabel='Удалить'
          onConfirm={() => navigate(ROUTES.PREVIEW_PROFILE)}
        >
          <UserMinusIcon />
          Удалить из друзей
        </ConfirmAction>
      </Rise>
    </Screen>
  )
}

export default FriendScreen
