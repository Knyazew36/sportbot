import { ArrowRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useTemplates } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

/** Сколько шаблонов в ленте: остальное — в каталоге с фильтрами */
const PICKS = 6

// «Подобрать программу»: первые шаблоны каталога лентой, чтобы было видно — программ много и можно
// выбрать под себя. Фильтры живут в каталоге: ряды чипов здесь превратили бы страницу в простыню
export const CatalogPicks = ({ title }: { title: string }) => {
  const templates = useTemplates()
  const picks = templates.data?.slice(0, PICKS) ?? []
  if (!picks.length) return null

  return (
    <ScreenSection
      title={title}
      bleed
      action={
        <ButtonLink
          to={ROUTES.PROGRAM_TEMPLATES}
          variant='link'
          size='sm'
          className='h-auto p-0'
        >
          Все
          <ArrowRightIcon />
        </ButtonLink>
      }
    >
      <ul className='no-scrollbar px-gutter flex gap-2 overflow-x-auto pb-1'>
        {picks.map(t => (
          <li
            key={t.id}
            className='w-60 shrink-0'
          >
            <Link
              to={buildPath(ROUTES.PROGRAM_TEMPLATE, { templateId: t.id })}
              className='border-foreground/80 hover:bg-accent/60 flex h-full flex-col gap-2 border-[1.5px] p-3 transition-colors'
            >
              <Poster
                as='h3'
                size='md'
                className='line-clamp-2'
              >
                {t.name}
              </Poster>
              {t.description && (
                <Text
                  size='sm'
                  tone='soft'
                  className='line-clamp-2'
                >
                  {t.description}
                </Text>
              )}
              <div className='mt-auto flex flex-wrap gap-1.5 pt-1'>
                {t.takenProgramId != null && <Badge variant='secondary'>уже у тебя</Badge>}
                {t.tags.slice(0, 3).map(tg => (
                  <Badge key={tg.id}>{tg.name}</Badge>
                ))}
              </div>
              <Eyebrow>{pluralize(t.complexes.length, ['комплекс', 'комплекса', 'комплексов'])}</Eyebrow>
            </Link>
          </li>
        ))}
      </ul>
    </ScreenSection>
  )
}
