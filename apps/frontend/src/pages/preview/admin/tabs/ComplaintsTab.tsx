import { CheckIcon, PencilIcon } from 'lucide-react'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { complaints } from '../../model/admin'
import { exercises, stretches } from '../../model/catalog'

// Жалобы на описания: текст, запись, «открыть на правку» и «закрыть» (frontend-tz, 14.4)
export const ComplaintsTab = () => {
  const [closed, setClosed] = useState<number[]>([])
  const open = complaints.filter(c => !closed.includes(c.id))

  if (open.length === 0) {
    return (
      <Rise className='px-gutter'>
        <ScreenState
          state='empty'
          title='Жалоб нет'
          description='Все разобраны.'
        />
      </Rise>
    )
  }

  return (
    <>
      {open.map(c => {
        const record = (c.kind === 'exercise' ? exercises : stretches).find(x => x.id === c.catalogId)
        return (
          <Rise
            key={c.id}
            className='border-foreground/80 mx-gutter flex flex-col gap-3 border-[1.5px] p-4'
          >
            <div className='flex flex-wrap items-center gap-1.5'>
              <Badge variant='secondary'>{c.kind === 'exercise' ? 'упражнение' : 'растяжка'}</Badge>
              <Eyebrow>
                {c.author} · {c.createdAt}
              </Eyebrow>
            </div>
            <Poster>{record?.name ?? 'Запись удалена'}</Poster>
            <Text className='border-primary/60 border-l-2 pl-3'>{c.text}</Text>
            <div className='grid grid-cols-2 gap-2'>
              <ButtonLink
                to={buildPath(ROUTES.PREVIEW_ADMIN_CATALOG_ITEM, { kind: c.kind, itemId: c.catalogId })}
                variant='outline'
                size='sm'
                className='h-11'
              >
                <PencilIcon />
                Править запись
              </ButtonLink>
              <Button
                size='sm'
                className='h-11'
                onClick={() => setClosed(ids => [...ids, c.id])}
              >
                <CheckIcon strokeWidth={3} />
                Закрыть
              </Button>
            </div>
          </Rise>
        )
      })}
    </>
  )
}
