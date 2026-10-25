import { Navigate, useParams } from 'react-router'

import { useProfile } from '@sportbot/api/entities/profile'
import { ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { BlockHeading } from '@/shared/ui/kit/ScreenSection'

import { findMeSection } from '@/shared/config/me-sections'

import { SECTION_ITEMS } from './sections'

// Экран раздела профиля: «Назад» в меню и все пункты раздела подряд
const MeSectionPage = () => {
  const section = findMeSection(useParams().section)
  const items = section ? (SECTION_ITEMS[section.slug] ?? []) : []
  const profile = useProfile()

  // Старая или выдуманная ссылка — в меню профиля, а не на 404
  if (!section || !items.length)
    return (
      <Navigate
        to={ROUTES.ME}
        replace
      />
    )

  // Пункт один — его шапку заменяет заголовок экрана
  const numbered = items.length > 1

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME}
          title={section.title}
        />
      }
      className='gap-12'
    >
      <QueryScreen query={profile}>
        {p =>
          items.map((item, i) => (
            <div
              key={item.title}
              className='flex flex-col gap-4'
            >
              {numbered && (
                <Rise className='px-gutter'>
                  <div className='border-foreground border-t-[3px] pt-3'>
                    <BlockHeading
                      index={i + 1}
                      title={item.title}
                    />
                  </div>
                </Rise>
              )}
              {item.render(p)}
            </div>
          ))
        }
      </QueryScreen>
    </Screen>
  )
}

export default MeSectionPage
