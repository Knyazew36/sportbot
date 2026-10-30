import { ArrowRightIcon } from 'lucide-react'

import { useTemplates } from '@sportbot/api/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'

import { TemplateTile } from '@/widgets/program-templates/TemplateTile'

/** Сколько шаблонов в ленте: остальное — в каталоге с фильтрами */
const PICKS = 6

// «Подобрать программу»: первые шаблоны каталога лентой, чтобы было видно — программ много и можно
// выбрать под себя. Фильтры живут в каталоге: ряды чипов здесь превратили бы страницу в простыню.
// Уже взятые шаблоны не показываем: они и так в «Моих программах» выше
export const CatalogPicks = ({ title }: { title: string }) => {
  const templates = useTemplates()
  const picks = templates.data?.filter(t => t.takenProgramId == null).slice(0, PICKS) ?? []
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
          Весь каталог
          <ArrowRightIcon />
        </ButtonLink>
      }
    >
      <ul className='no-scrollbar px-gutter flex gap-2 overflow-x-auto pb-1'>
        {picks.map(t => (
          <TemplateTile
            key={t.id}
            template={t}
          />
        ))}
      </ul>
    </ScreenSection>
  )
}
