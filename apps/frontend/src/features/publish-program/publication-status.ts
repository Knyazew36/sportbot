import { EyeOffIcon, GlobeIcon, HourglassIcon, XIcon } from 'lucide-react'

import type { ProgramPublication } from '@sportbot/api/generated/model'
import type { StatusMeta } from '@/shared/ui/kit/StatusBadge'

/**
 * Статус публикации программы в каталоге «Программы пользователей» — для автора. Жёлтый — цвет «видят другие»,
 * как у кнопки публикации; на проверке программа ещё не наружу — без цвета
 */
export const PUBLICATION_STATUS: Record<ProgramPublication, StatusMeta> = {
  DRAFT: { tone: 'neutral', icon: EyeOffIcon, label: 'только у тебя' },
  PENDING: { tone: 'outline', icon: HourglassIcon, label: 'на проверке' },
  PUBLISHED: { tone: 'attention', icon: GlobeIcon, label: 'в каталоге' },
  REJECTED: { tone: 'danger', icon: XIcon, label: 'не прошла проверку' },
}
