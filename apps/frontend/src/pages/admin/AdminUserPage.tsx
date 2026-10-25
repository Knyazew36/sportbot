import { BanIcon, RotateCcwIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { type AdminUserDetail, useAdminUser, useBlockUser, useUnblockUser } from '@sportbot/api/entities/admin'
import { useSportUser } from '@sportbot/api/entities/sport-user'
import { ROUTES } from '@/shared/config/paths'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { messengers } from './components/UsersTab'
import { UserActivity } from './components/UserActivity'
import { UserProfile } from './components/UserProfile'
import { UserWorkouts } from './components/UserWorkouts'

const BACK = `${ROUTES.ADMIN}?tab=users`

const BlockAction = ({ user }: { user: AdminUserDetail }) => {
  const block = useBlockUser()
  const unblock = useUnblockUser()

  return (
    <ConfirmAction
      trigger={
        <Button
          variant={user.blocked ? 'outline' : 'destructive'}
          size='lg'
        />
      }
      title={user.blocked ? `Разблокировать ${user.displayName}?` : `Заблокировать ${user.displayName}?`}
      description={
        user.blocked
          ? 'Пользователь снова сможет открыть приложение и писать боту.'
          : 'Приложение покажет «Доступ закрыт», бот перестанет отвечать. Данные сохранятся.'
      }
      confirmLabel={user.blocked ? 'Разблокировать' : 'Заблокировать'}
      confirmVariant={user.blocked ? 'default' : 'destructive'}
      onConfirm={() => (user.blocked ? unblock.mutateAsync(user.id) : block.mutateAsync(user.id))}
    >
      {user.blocked ? <RotateCcwIcon /> : <BanIcon />}
      {user.blocked ? 'Разблокировать' : 'Заблокировать'}
    </ConfirmAction>
  )
}

const flags = (u: AdminUserDetail) =>
  [
    u.isAdmin && 'админ',
    u.blocked && 'заблокирован',
    u.paused && 'на паузе',
    !u.onboarded && 'не прошёл настройку',
  ].filter(Boolean)

// Карточка пользователя для поддержки: кто он, тренируется ли, что делал последним (frontend-tz, 14.5)
const AdminUserPage = () => {
  const userId = Number(useParams().userId)
  const user = useAdminUser(userId)
  const me = useSportUser()
  // Админа и себя не блокируем: бэк это тоже запрещает
  const canBlock = user.data && !user.data.isAdmin && user.data.id !== me.data?.userId

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={user.data?.displayName ?? 'Пользователь'}
          subtitle={user.data && messengers(user.data)}
        />
      }
      footer={
        canBlock && (
          <StickyFooter>
            <BlockAction user={user.data} />
          </StickyFooter>
        )
      }
    >
      <QueryScreen query={user}>
        {u => (
          <>
            <Rise className='px-gutter flex flex-col gap-3'>
              {flags(u).length > 0 && (
                <Text
                  size='sm'
                  tone={u.blocked ? 'danger' : 'muted'}
                >
                  {flags(u).join(' · ')}
                </Text>
              )}
              <StatGrid
                framed
                items={[
                  { label: 'тренировок', value: u.workoutsTotal },
                  { label: 'серия', value: u.currentStreak },
                  { label: 'лучшая', value: u.bestStreak },
                ]}
              />
            </Rise>
            <ScreenSection
              variant='block'
              index={1}
              title='Активность'
              aside='12 недель'
            >
              <UserActivity user={u} />
            </ScreenSection>
            <ScreenSection
              variant='block'
              index={2}
              title='Тренировки'
              aside='последние 20'
            >
              <UserWorkouts workouts={u.recentWorkouts} />
            </ScreenSection>
            <ScreenSection
              variant='block'
              index={3}
              title='Профиль'
            >
              <UserProfile user={u} />
            </ScreenSection>
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default AdminUserPage
