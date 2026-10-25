import type { ReactNode } from 'react';

import type { Profile } from '@sportbot/api/entities/profile';

import { ThemeSection } from '@/features/change-theme/ThemeSection';
import type { MeSectionSlug } from '@/shared/config/me-sections';

import { DeleteAccountSection } from './components/DeleteAccountSection';
import { LogoutButton } from './components/LogoutButton';

export type MeItem = {
  title: string;
  render: (profile: Profile) => ReactNode;
};

// Пункты раздела идут на его экране подряд — порт pages/me-section/sections.tsx.
// Раздел без пунктов ещё не перенесён — его экран показывает «Скоро».
// В аккаунте пока только выход и удаление: удаление обязательно для App Store, остальные пункты — этап 2
export const SECTION_ITEMS: Partial<Record<MeSectionSlug, MeItem[]>> = {
  account: [
    { title: 'Выход', render: () => <LogoutButton /> },
    { title: 'Удаление данных', render: () => <DeleteAccountSection /> },
  ],
  app: [{ title: 'Оформление', render: () => <ThemeSection /> }],
};
