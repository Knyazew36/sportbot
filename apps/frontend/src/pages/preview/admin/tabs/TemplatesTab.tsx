import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

import { templates } from '../../model/mock'

// Шаблоны программ: тот же редактор, что у программ пользователя, плюс описание (frontend-tz, 14.2)
export const TemplatesTab = () => (
  <Rise className='flex flex-col gap-3 px-5'>
    <div className='flex items-center justify-between gap-3'>
      <Eyebrow>шаблонов: {templates.length}</Eyebrow>
      <ButtonLink
        to={buildPath(ROUTES.PREVIEW_ADMIN_TEMPLATE, { templateId: 'new' })}
        size='sm'
      >
        <PlusIcon strokeWidth={2.5} />
        Новый шаблон
      </ButtonLink>
    </div>
    <List>
      {templates.map(t => (
        <ListRow
          key={t.id}
          lead={String(t.complexes.length).padStart(2, '0')}
          className='relative'
          title={
            <Link
              to={buildPath(ROUTES.PREVIEW_ADMIN_TEMPLATE, { templateId: t.id })}
              className='underline-offset-4 after:absolute after:inset-0 hover:underline'
            >
              {t.title}
            </Link>
          }
          meta={t.complexes.map(c => c.title).join(' · ')}
        >
          <div className='mt-2 flex flex-wrap gap-1.5'>
            <Badge variant='secondary'>{t.days} дня в неделю</Badge>
            <Badge variant='outline'>{t.level}</Badge>
          </div>
        </ListRow>
      ))}
    </List>
  </Rise>
)
