import { EyeOff, Globe, Hourglass, X } from 'lucide-react-native';

import type { ProgramPublication } from '@sportbot/api/generated/model';

import type { StatusMeta } from '@/shared/ui/kit/StatusBadge';

/**
 * Статус публикации программы в каталоге «Программы пользователей» — для автора. Порт features/publish-program.
 * Жёлтый — цвет «видят другие», как у кнопки публикации; на проверке программа ещё не наружу — без цвета
 */
export const PUBLICATION_STATUS: Record<ProgramPublication, StatusMeta> = {
  DRAFT: { tone: 'neutral', icon: EyeOff, label: 'только у тебя' },
  PENDING: { tone: 'outline', icon: Hourglass, label: 'на проверке' },
  PUBLISHED: { tone: 'attention', icon: Globe, label: 'в каталоге' },
  REJECTED: { tone: 'danger', icon: X, label: 'не прошла проверку' },
};
