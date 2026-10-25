import {
  BellRingIcon,
  ClapperboardIcon,
  HeartPulseIcon,
  type LucideIcon,
  PaletteIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from 'lucide-react'

import { ROUTES } from './paths'

export type MeSectionSlug = 'training' | 'body' | 'friends' | 'account' | 'app' | 'editor'

export type MeSection = {
  slug: MeSectionSlug
  title: string
  icon: LucideIcon
  /** Свой экран вместо общего экрана раздела */
  to?: string
}

// Разделы профиля: меню (/me) показывает кнопки, экран раздела (/me/:section) — их пункты.
// Порядок — по частоте: тренировки трогают каждую неделю, аккаунт — почти никогда (frontend-tz, 13)
export const ME_SECTIONS: MeSection[] = [
  { slug: 'training', title: 'Тренировки', icon: BellRingIcon },
  { slug: 'body', title: 'Тело', icon: HeartPulseIcon },
  { slug: 'friends', title: 'Друзья', icon: UsersRoundIcon },
  { slug: 'account', title: 'Аккаунт', icon: UserRoundIcon },
  { slug: 'app', title: 'Оформление', icon: PaletteIcon },
  { slug: 'editor', title: 'Редактор', icon: ClapperboardIcon, to: ROUTES.ME_EDITOR },
]

export const findMeSection = (slug: string | undefined): MeSection | undefined =>
  ME_SECTIONS.find(section => section.slug === slug)
