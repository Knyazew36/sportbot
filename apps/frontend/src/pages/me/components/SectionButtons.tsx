import type { Profile } from '@sportbot/api/entities/profile'
import { ME_SECTIONS } from '@/shared/config/me-sections'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'

import { useSectionMeta } from '../model/use-section-meta'
import { SectionTicket } from './SectionTicket'

// Разделы — билеты под палец: каждый открывает экран со своими пунктами.
// На паузе билет тренировок синий — это состояние, о котором стоит помнить
export const SectionButtons = ({ profile }: { profile: Profile }) => {
  const meta = useSectionMeta(profile)
  const paused = !!profile.pause && !profile.pause.expired

  return (
    <Rise className='px-gutter flex flex-col gap-4'>
      {ME_SECTIONS.map(({ slug, title, icon, to }, i) => (
        <SectionTicket
          key={slug}
          to={to ?? buildPath(ROUTES.ME_SECTION, { section: slug })}
          index={i + 1}
          icon={icon}
          title={title}
          meta={meta[slug]}
          marked={slug === 'training' && paused}
        />
      ))}
    </Rise>
  )
}
