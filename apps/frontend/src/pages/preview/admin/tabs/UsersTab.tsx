import { BanIcon, RotateCcwIcon } from 'lucide-react'

import { useState } from 'react'

import { normalizeName } from '@/entities/catalog/lib'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { SearchField } from '@/shared/ui/kit/SearchField'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { adminUsers } from '../../model/admin'

// Пользователи: поиск, блокировка и разблокировка с подтверждением (frontend-tz, 14.5)
export const UsersTab = () => {
  const [query, setQuery] = useState('')
  const [blocked, setBlocked] = useState<number[]>(adminUsers.filter(u => u.blocked).map(u => u.id))
  const found = adminUsers.filter(u => normalizeName(u.name).includes(normalizeName(query)))

  const toggle = (id: number) => setBlocked(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))

  return (
    <Rise className='flex flex-col gap-3 px-gutter'>
      <SearchField
        value={query}
        onValueChange={setQuery}
        placeholder='Имя пользователя'
      />
      <Eyebrow>
        найдено: {found.length} · заблокировано: {blocked.length}
      </Eyebrow>
      {found.length === 0 ? (
        <ScreenState
          state='empty'
          title='Никого не нашлось'
          description='Попробуй другое имя.'
        />
      ) : (
        <List>
          {found.map(u => {
            const isBlocked = blocked.includes(u.id)
            return (
              <ListRow
                key={u.id}
                lead={u.streak}
                title={u.name}
                meta={`${u.messengers} · был ${u.lastSeen}`}
                trail={
                  u.admin ? (
                    <Badge>админ</Badge>
                  ) : (
                    <ConfirmAction
                      trigger={
                        <Button
                          variant={isBlocked ? 'outline' : 'destructive'}
                          size='xs'
                        />
                      }
                      title={isBlocked ? `Разблокировать ${u.name}?` : `Заблокировать ${u.name}?`}
                      description={
                        isBlocked
                          ? 'Пользователь снова сможет открыть приложение и писать боту.'
                          : 'Приложение покажет «Доступ закрыт», бот перестанет отвечать. Данные сохранятся.'
                      }
                      confirmLabel={isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      confirmVariant={isBlocked ? 'default' : 'destructive'}
                      onConfirm={() => toggle(u.id)}
                    >
                      {isBlocked ? <RotateCcwIcon /> : <BanIcon />}
                      {isBlocked ? 'Вернуть' : 'Блок'}
                    </ConfirmAction>
                  )
                }
              >
                {isBlocked && (
                  <Badge
                    variant='destructive'
                    className='mt-2'
                  >
                    заблокирован
                  </Badge>
                )}
              </ListRow>
            )
          })}
        </List>
      )}
    </Rise>
  )
}
