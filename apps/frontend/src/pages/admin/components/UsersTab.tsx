import { BanIcon, RotateCcwIcon } from 'lucide-react'

import { useState } from 'react'

import { type AdminUser, useAdminUsers, useBlockUser, useUnblockUser } from '@/entities/admin'
import { useSportUser } from '@/entities/sport-user'
import { formatDate } from '@/shared/lib/format'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { LoadMore } from '@/shared/ui/kit/LoadMore'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

const messengers = (u: AdminUser) =>
  [u.telegramId && 'Telegram', u.maxId && 'MAX', u.username && `@${u.username}`].filter(Boolean).join(' · ')

// Пользователи: поиск, блокировка и разблокировка с подтверждением (frontend-tz, 14.5)
export const UsersTab = () => {
  const [query, setQuery] = useState('')
  const users = useAdminUsers(useDebouncedValue(query.trim()))
  const me = useSportUser()
  const block = useBlockUser()
  const unblock = useUnblockUser()

  return (
    <Rise className='flex flex-col gap-3 px-gutter'>
      <SearchField
        value={query}
        onValueChange={setQuery}
        placeholder='Имя или @username'
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
                <ListRow
                  key={u.id}
                  title={u.displayName}
                  meta={[messengers(u), `с ${formatDate(u.createdAt, 'd MMM yyyy')}`].filter(Boolean).join(' · ')}
                  trail={
                    // Админа и себя не блокируем: бэк это тоже запрещает
                    u.isAdmin || u.id === me.data?.userId ? (
                      <Badge>админ</Badge>
                    ) : (
                      <ConfirmAction
                        trigger={
                          <Button
                            variant={u.blocked ? 'outline' : 'destructive'}
                            size='xs'
                          />
                        }
                        title={u.blocked ? `Разблокировать ${u.displayName}?` : `Заблокировать ${u.displayName}?`}
                        description={
                          u.blocked
                            ? 'Пользователь снова сможет открыть приложение и писать боту.'
                            : 'Приложение покажет «Доступ закрыт», бот перестанет отвечать. Данные сохранятся.'
                        }
                        confirmLabel={u.blocked ? 'Разблокировать' : 'Заблокировать'}
                        confirmVariant={u.blocked ? 'default' : 'destructive'}
                        onConfirm={() => (u.blocked ? unblock.mutateAsync(u.id) : block.mutateAsync(u.id))}
                      >
                        {u.blocked ? <RotateCcwIcon /> : <BanIcon />}
                        {u.blocked ? 'Вернуть' : 'Блок'}
                      </ConfirmAction>
                    )
                  }
                >
                  <div className='mt-2 flex flex-wrap gap-1.5'>
                    {u.blocked && <Badge variant='destructive'>заблокирован</Badge>}
                    {!u.onboarded && <Badge variant='outline'>не прошёл настройку</Badge>}
                  </div>
                </ListRow>
              ))}
          </List>
        )}
      </QueryScreen>
      <LoadMore query={users} />
    </Rise>
  )
}
