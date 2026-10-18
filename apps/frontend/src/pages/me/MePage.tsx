import { pluralize } from '@front-cmdt/utils/pluralize'

import { useLimitations } from '@/entities/limitation'
import { MESSENGER_LABEL, useLinkState } from '@/entities/link'
import { type Profile, useProfile } from '@/entities/profile'
import { useFriends } from '@/entities/social'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { useThemeChoice } from '@/shared/lib/hooks/use-messenger-theme'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { WEEKDAYS } from '@/shared/lib/weekdays'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'

import { AccountCard } from './components/AccountCard'
import { DeveloperTicket } from './components/DeveloperTicket'
import { SectionTicket } from './components/SectionTicket'
import { PALETTES, THEME_OPTIONS } from './components/ThemeSection'
import { ME_SECTIONS, type MeSectionSlug } from './sections'

// Строка под кнопкой раздела: главное из него видно, не заходя внутрь
const useSectionMeta = (profile: Profile): Partial<Record<MeSectionSlug, string>> => {
  const limitations = useLimitations()
  const friends = useFriends()
  const links = useLinkState()
  const [palette] = usePaletteChoice()
  const [theme] = useThemeChoice()

  const days = WEEKDAYS.filter(d => profile.trainingDays.includes(d.value))
    .map(d => d.short)
    .join(' ')
  const pause = profile.pause && !profile.pause.expired ? profile.pause : null
  const limits = limitations.data?.length

  return {
    training: pause
      ? `на паузе ${pause.endDate ? `до ${formatDate(pause.endDate, 'd MMMM')}` : 'до отмены'}`
      : `${days || 'дни не выбраны'} · ${profile.morningTime} / ${profile.eveningTime}`,
    body:
      [
        profile.lastBodyWeight != null && `${profile.lastBodyWeight} кг`,
        limits && pluralize(limits, ['ограничение', 'ограничения', 'ограничений']),
      ]
        .filter(Boolean)
        .join(' · ') || 'вес и ограничения',
    friends: friends.data?.length ? pluralize(friends.data.length, ['друг', 'друга', 'друзей']) : 'пригласи друзей',
    account: ['имя, пол, фото', ...(links.data?.linked.map(m => MESSENGER_LABEL[m]) ?? [])].join(' · '),
    app: [PALETTES.find(p => p.value === palette)?.label, THEME_OPTIONS.find(o => o.value === theme)?.label]
      .filter(Boolean)
      .join(' · '),
    editor: 'плашки для своих видео',
  }
}

// Разделы — билеты под палец: каждый открывает экран со своими пунктами.
// На паузе билет тренировок синий — это состояние, о котором стоит помнить
const SectionButtons = ({ profile }: { profile: Profile }) => {
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

// Профиль (frontend-tz, 13): карта участника и кнопки разделов, пункты — на экранах разделов
const MePage = () => {
  const profile = useProfile()

  return (
    <Screen
      header={<ScreenHeader title='Профиль' />}
      className='gap-10'
    >
      <QueryScreen query={profile}>
        {p => (
          <>
            <AccountCard profile={p} />
            <SectionButtons profile={p} />
            <DeveloperTicket />
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default MePage
