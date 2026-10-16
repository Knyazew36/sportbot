import { BellRingIcon, HeartPulseIcon, type LucideIcon, PaletteIcon, UserRoundIcon, UsersRoundIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import type { Profile } from '@/entities/profile'

import { AboutSection } from './components/AboutSection'
import { BodyWeightSection } from './components/BodyWeightSection'
import { DeleteDataSection } from './components/DeleteDataSection'
import { FriendsSection } from './components/FriendsSection'
import { LimitsSection } from './components/LimitsSection'
import { MessengersSection } from './components/MessengersSection'
import { PauseSection } from './components/PauseSection'
import { ScheduleSection } from './components/ScheduleSection'
import { ThemeSection } from './components/ThemeSection'
import { TrainingSection } from './components/TrainingSection'

export type MeSectionSlug = 'training' | 'body' | 'friends' | 'account' | 'app'

type MeItem = {
  title: string
  render: (profile: Profile) => ReactNode
}

type MeSection = {
  slug: MeSectionSlug
  title: string
  icon: LucideIcon
  /** Пункты раздела — идут на его экране подряд */
  items: MeItem[]
}

// Профиль — кнопки разделов, каждый открывается своим экраном /me/:section со всеми его пунктами
// (frontend-tz, 13). Порядок — по частоте: тренировки трогают каждую неделю, аккаунт — почти никогда
export const ME_SECTIONS: MeSection[] = [
  {
    slug: 'training',
    title: 'Тренировки',
    icon: BellRingIcon,
    items: [
      { title: 'Расписание', render: p => <ScheduleSection profile={p} /> },
      { title: 'Таймер и сигналы', render: p => <TrainingSection profile={p} /> },
      { title: 'Пауза', render: p => <PauseSection profile={p} /> },
    ],
  },
  {
    slug: 'body',
    title: 'Тело',
    icon: HeartPulseIcon,
    items: [
      { title: 'Вес тела', render: p => <BodyWeightSection profile={p} /> },
      { title: 'Ограничения по суставам', render: () => <LimitsSection /> },
    ],
  },
  {
    slug: 'friends',
    title: 'Друзья',
    icon: UsersRoundIcon,
    items: [{ title: 'Друзья', render: () => <FriendsSection /> }],
  },
  {
    slug: 'account',
    title: 'Аккаунт',
    icon: UserRoundIcon,
    items: [
      { title: 'Имя и пол', render: p => <AboutSection profile={p} /> },
      { title: 'Мессенджеры', render: () => <MessengersSection /> },
      { title: 'Удаление данных', render: () => <DeleteDataSection /> },
    ],
  },
  {
    slug: 'app',
    title: 'Оформление',
    icon: PaletteIcon,
    items: [{ title: 'Оформление', render: () => <ThemeSection /> }],
  },
]

export const findMeSection = (slug: string | undefined): MeSection | undefined =>
  ME_SECTIONS.find(section => section.slug === slug)
