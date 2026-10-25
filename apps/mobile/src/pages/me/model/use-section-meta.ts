import { pluralize } from '@front-cmdt/utils/pluralize';

import { useLimitations } from '@sportbot/api/entities/limitation';
import { MESSENGER_LABEL, useLinkState } from '@sportbot/api/entities/link';
import type { Profile } from '@sportbot/api/entities/profile';
import { useFriends } from '@sportbot/api/entities/social';

import { PALETTES, THEME_OPTIONS } from '@/features/change-theme/options';
import type { MeSectionSlug } from '@/shared/config/me-sections';
import { formatDate } from '@/shared/lib/format';
import { WEEKDAYS } from '@/shared/lib/weekdays';
import { useTheme } from '@/shared/theme/ThemeProvider';

// Строка под кнопкой раздела — порт pages/me/model/use-section-meta.ts: главное из раздела видно, не заходя внутрь
export const useSectionMeta = (profile: Profile): Partial<Record<MeSectionSlug, string>> => {
  const limitations = useLimitations();
  const friends = useFriends();
  const links = useLinkState();
  const { palette, choice } = useTheme();

  const days = WEEKDAYS.filter((d) => profile.trainingDays.includes(d.value))
    .map((d) => d.short)
    .join(' ');
  const pause = profile.pause && !profile.pause.expired ? profile.pause : null;
  const limits = limitations.data?.length;

  return {
    training: pause
      ? `на паузе ${pause.endDate ? `до ${formatDate(pause.endDate, 'd MMMM')}` : 'до отмены'}`
      : `${days || 'дни не выбраны'} · ${profile.questionsEnabled ? `${profile.morningTime} / ${profile.eveningTime}` : 'без вопросов'}`,
    body:
      [
        profile.lastBodyWeight != null && `${profile.lastBodyWeight} кг`,
        limits && pluralize(limits, ['ограничение', 'ограничения', 'ограничений']),
      ]
        .filter(Boolean)
        .join(' · ') || 'вес и ограничения',
    friends: friends.data?.length ? pluralize(friends.data.length, ['друг', 'друга', 'друзей']) : 'пригласи друзей',
    account: ['имя, пол, фото', ...(links.data?.linked.map((m) => MESSENGER_LABEL[m]) ?? [])].join(' · '),
    app: [PALETTES.find((p) => p.value === palette)?.label, THEME_OPTIONS.find((o) => o.value === choice)?.label]
      .filter(Boolean)
      .join(' · '),
  };
};
