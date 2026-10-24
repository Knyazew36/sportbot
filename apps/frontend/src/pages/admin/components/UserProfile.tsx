import type { AdminUserDetail } from '@/entities/admin'
import { formatDate, formatDateTime, NO_DATA } from '@/shared/lib/format'
import { WEEKDAYS } from '@/shared/lib/weekdays'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Text } from '@/shared/ui/kit/Typography'

const GENDER = { MALE: 'мужской', FEMALE: 'женский' } as const

// Дни — с понедельника, как в настройках пользователя
const days = (values: number[]) =>
  WEEKDAYS.filter(d => values.includes(d.value))
    .map(d => d.short)
    .join(', ') || NO_DATA

// Профиль строками «поле — значение»: всё, о чём спрашивают в поддержке
export const UserProfile = ({ user }: { user: AdminUserDetail }) => {
  const rows: [string, string | number][] = [
    ['id', user.id],
    ['Telegram id', user.telegramId ?? NO_DATA],
    ['MAX id', user.maxId ?? NO_DATA],
    ['Ник', user.username ? `@${user.username}` : NO_DATA],
    ['Пришёл', formatDateTime(user.createdAt)],
    ['Прошёл настройку', user.onboardedAt ? formatDate(user.onboardedAt) : 'нет'],
    ['Часовой пояс', user.timeZone],
    ['Пол', user.gender ? GENDER[user.gender] : NO_DATA],
    ['Дни тренировок', days(user.trainingDays)],
    ['Вопросы бота', user.questionsEnabled ? 'включены' : 'выключены'],
    ['Программа', user.activeProgram ?? NO_DATA],
    ['Своих программ', user.programs],
    ['Друзей', user.friends],
    ['Заявок в справочник', user.requests],
    ['Жалоб', user.complaints],
  ]

  return (
    <List>
      {rows.map(([label, value]) => (
        <ListRow
          key={label}
          title={
            <Text
              as='span'
              size='sm'
              tone='muted'
            >
              {label}
            </Text>
          }
          trail={
            <Text
              as='span'
              size='sm'
              className='text-right'
            >
              {value}
            </Text>
          }
          className='py-2.5'
        />
      ))}
    </List>
  )
}
