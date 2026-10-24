import { useState } from 'react'

import { type AdminUser, useAdminUsers } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { List, ListLinkRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

export const messengers = (u: AdminUser) =>
  [u.telegramId && 'Telegram', u.maxId && 'MAX', u.username && `@${u.username}`].filter(Boolean).join(' · ')

// Состояние, ради которого админ открывает карточку: блок, недонастройка
const flags = (u: AdminUser) =>
  [u.isAdmin && 'админ', u.blocked && 'заблокирован', !u.onboarded && 'не прошёл настройку'].filter(Boolean).join(' · ')

// Пользователи: поиск и переход в карточку, где активность и блокировка (frontend-tz, 14.5)
export const UsersTab = () => {
  const [query, setQuery] = useState('')
  const users = useAdminUsers(useDebouncedValue(query.trim()))

  return (
    <Rise className='px-gutter flex flex-col gap-3'>
      <SearchField
        value={query}
        onValueChange={setQuery}
        placeholder='Имя, @username или id'
      />
      <Eyebrow>найдено: {users.data?.pages[0]?.meta?.total ?? '—'}</Eyebrow>
      <QueryScreen
        query={users}
        className=''
        isEmpty={data => !data.pages[0]?.items?.length}
        empty={{ title: 'Никого не нашлось', description: 'Попробуй другое имя.' }}
      >
        {data => (
          <List>
            {data.pages
              .flatMap(page => page.items ?? [])
              .map(u => (
                <ListLinkRow
                  key={u.id}
                  to={buildPath(ROUTES.ADMIN_USER, { userId: u.id })}
                  title={u.displayName}
                  meta={[
                    messengers(u),
                    `с ${formatDate(u.createdAt, 'd MMM yyyy')}`,
                    u.lastActiveAt ? `тренировка ${formatDate(u.lastActiveAt, 'd MMM')}` : 'не тренировался',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                >
                  {flags(u) && (
                    <Text
                      size='xs'
                      tone={u.blocked ? 'danger' : 'muted'}
                      className='mt-1'
                    >
                      {flags(u)}
                    </Text>
                  )}
                </ListLinkRow>
              ))}
          </List>
        )}
      </QueryScreen>
      <LoadMore query={users} />
    </Rise>
  )
}
