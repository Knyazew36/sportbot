import type { Profile } from '@sportbot/api/entities/profile';

import { ME_SECTIONS } from '@/shared/config/me-sections';
import { ROUTES } from '@/shared/config/routes';
import { Rise } from '@/shared/ui/kit/Reveal';

import { useSectionMeta } from '../model/use-section-meta';
import { SectionTicket } from './SectionTicket';

// Разделы — билеты под палец, порт pages/me/components/SectionButtons.tsx: каждый открывает экран со своими пунктами.
// На паузе билет тренировок синий — это состояние, о котором стоит помнить
export const SectionButtons = ({ profile }: { profile: Profile }) => {
  const meta = useSectionMeta(profile);
  const paused = !!profile.pause && !profile.pause.expired;

  return (
    <Rise className="px-gutter gap-4">
      {ME_SECTIONS.map(({ slug, title, icon }, i) => (
        <SectionTicket
          key={slug}
          href={{ pathname: ROUTES.ME_SECTION, params: { section: slug } }}
          index={i + 1}
          icon={icon}
          title={title}
          meta={meta[slug]}
          marked={slug === 'training' && paused}
        />
      ))}
    </Rise>
  );
};
