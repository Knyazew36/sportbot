import type { ReactNode } from 'react';

import type { Profile } from '@sportbot/api/entities/profile';

import { ThemeSection } from '@/features/change-theme/ThemeSection';
import type { MeSectionSlug } from '@/shared/config/me-sections';

import { AboutSection } from './components/AboutSection';
import { BodyWeightSection } from './components/BodyWeightSection';
import { DeleteAccountSection } from './components/DeleteAccountSection';
import { ExcludedStretchesSection } from './components/ExcludedStretchesSection';
import { FriendsSection } from './components/FriendsSection';
import { LimitsSection } from './components/LimitsSection';
import { LogoutButton } from './components/LogoutButton';
import { MessengersSection } from './components/MessengersSection';
import { OfflineSection } from './components/OfflineSection';
import { PauseSection } from './components/PauseSection';
import { PhotoSection } from './components/PhotoSection';
import { ScheduleSection } from './components/ScheduleSection';
import { TrainingSection } from './components/TrainingSection';

export type MeItem = {
  title: string;
  render: (profile: Profile) => ReactNode;
};

// Пункты раздела идут на его экране подряд — порт pages/me-section/sections.tsx.
// В аккаунте сверх фронта — выход: в мобилке вход по email, а не через мессенджер
export const SECTION_ITEMS: Record<MeSectionSlug, MeItem[]> = {
  training: [
    { title: 'Расписание', render: (p) => <ScheduleSection profile={p} /> },
    { title: 'Таймер и сигналы', render: (p) => <TrainingSection profile={p} /> },
    { title: 'Пауза', render: (p) => <PauseSection profile={p} /> },
  ],
  body: [
    { title: 'Вес тела', render: (p) => <BodyWeightSection profile={p} /> },
    { title: 'Ограничения по суставам', render: () => <LimitsSection /> },
    { title: 'Исключённые растяжки', render: () => <ExcludedStretchesSection /> },
  ],
  friends: [{ title: 'Друзья', render: () => <FriendsSection /> }],
  account: [
    { title: 'Имя и пол', render: (p) => <AboutSection profile={p} /> },
    { title: 'Фото', render: (p) => <PhotoSection profile={p} /> },
    { title: 'Мессенджеры', render: () => <MessengersSection /> },
    { title: 'Выход', render: () => <LogoutButton /> },
    { title: 'Удаление данных', render: () => <DeleteAccountSection /> },
  ],
  offline: [{ title: 'Офлайн', render: () => <OfflineSection /> }],
  app: [{ title: 'Оформление', render: () => <ThemeSection /> }],
};
