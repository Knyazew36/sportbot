import type { ReactNode } from 'react';

import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Text } from '@/shared/ui/kit/Typography';

type StatsSectionProps = {
  title: string;
  aside?: ReactNode;
  /** Что значат цифры блока: без пояснения «рекорд» и «серию» не отличить */
  note: ReactNode;
  children: ReactNode;
};

// Блок статистики — порт widgets/stats/StatsSection.tsx: плакатная шапка и одна строка пояснения —
// блоки идут подряд и без шапки сливаются
export const StatsSection = ({ title, aside, note, children }: StatsSectionProps) => (
  <ScreenSection variant="block" title={title} aside={aside}>
    <Text size="sm" tone="muted" className="-mt-2">
      {note}
    </Text>
    {children}
  </ScreenSection>
);
