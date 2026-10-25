import type { ReactNode } from 'react'

import { ThemeSection } from '@/features/change-theme/ThemeSection'
import type { Profile } from '@sportbot/api/entities/profile'
import type { MeSectionSlug } from '@/shared/config/me-sections'

import { AboutSection } from './components/AboutSection'
import { BodyWeightSection } from './components/BodyWeightSection'
import { DeleteDataSection } from './components/DeleteDataSection'
import { ExcludedStretchesSection } from './components/ExcludedStretchesSection'
import { FriendsSection } from './components/FriendsSection'
import { LimitsSection } from './components/LimitsSection'
import { MessengersSection } from './components/MessengersSection'
import { PauseSection } from './components/PauseSection'
import { PhotoSection } from './components/PhotoSection'
import { ScheduleSection } from './components/ScheduleSection'
import { TrainingSection } from './components/TrainingSection'

export type MeItem = {
  title: string
  render: (profile: Profile) => ReactNode
}

// Пункты раздела идут на его экране подряд. У раздела со своим экраном (редактор) пунктов нет
export const SECTION_ITEMS: Partial<Record<MeSectionSlug, MeItem[]>> = {
  training: [
    { title: 'Расписание', render: p => <ScheduleSection profile={p} /> },
    { title: 'Таймер и сигналы', render: p => <TrainingSection profile={p} /> },
    { title: 'Пауза', render: p => <PauseSection profile={p} /> },
  ],
  body: [
    { title: 'Вес тела', render: p => <BodyWeightSection profile={p} /> },
    { title: 'Ограничения по суставам', render: () => <LimitsSection /> },
    { title: 'Исключённые растяжки', render: () => <ExcludedStretchesSection /> },
  ],
  friends: [{ title: 'Друзья', render: () => <FriendsSection /> }],
  account: [
    { title: 'Имя и пол', render: p => <AboutSection profile={p} /> },
    { title: 'Фото', render: p => <PhotoSection profile={p} /> },
    { title: 'Мессенджеры', render: () => <MessengersSection /> },
    { title: 'Удаление данных', render: () => <DeleteDataSection /> },
  ],
  app: [{ title: 'Оформление', render: () => <ThemeSection /> }],
}
