import type { Gender } from '@/shared/lib/hooks/use-palette'

// Подписи пола: шаг первого запуска и «Оформление» в профиле
export const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
]
