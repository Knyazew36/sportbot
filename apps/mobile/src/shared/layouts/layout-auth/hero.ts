// Содержимое hero на экранах входа. Цифры — пример тренировки из промо, не статистика пользователей
export type AuthHeroKind = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'messenger';

export type HeroTileTone = 'plain' | 'work' | 'rest';

export type HeroTile = { value: string; label: string; tone: HeroTileTone };

export type HeroConfig = {
  tiles: [HeroTile, HeroTile, HeroTile];
  /** Серифная строка под плитками */
  tagline: string;
  /** Текст штампа; null — без штампа (спокойные экраны) */
  stamp: string | null;
};

export const HERO: Record<AuthHeroKind, HeroConfig> = {
  login: {
    tiles: [
      { value: '7', label: 'упражнений', tone: 'plain' },
      { value: '23', label: 'подхода', tone: 'work' },
      { value: '2/3', label: 'в очереди', tone: 'rest' },
    ],
    tagline: 'тренировка не теряется —',
    stamp: 'День A ✓',
  },
  register: {
    tiles: [
      { value: '1', label: 'дни', tone: 'work' },
      { value: '2', label: 'время', tone: 'plain' },
      { value: '3', label: 'программа', tone: 'plain' },
    ],
    tagline: 'три шага до первого подхода —',
    stamp: 'Новая серия',
  },
  forgot: {
    tiles: [
      { value: '—', label: 'пауза', tone: 'rest' },
      { value: '·', label: 'план цел', tone: 'plain' },
      { value: '·', label: 'история цела', tone: 'plain' },
    ],
    tagline: 'пропуск без вины —',
    stamp: null,
  },
  reset: {
    tiles: [
      { value: '1', label: 'код', tone: 'plain' },
      { value: '2', label: 'пароль', tone: 'work' },
      { value: '3', label: 'вход', tone: 'plain' },
    ],
    tagline: 'почти на месте —',
    stamp: null,
  },
  verify: {
    tiles: [
      { value: '6', label: 'цифр', tone: 'work' },
      { value: '1', label: 'письмо', tone: 'plain' },
      { value: '0', label: 'паролей', tone: 'plain' },
    ],
    tagline: 'последний подход —',
    stamp: null,
  },
  messenger: {
    tiles: [
      { value: 'TG', label: 'Telegram', tone: 'plain' },
      { value: '→', label: 'подтвердить', tone: 'work' },
      { value: 'MAX', label: 'мессенджер', tone: 'plain' },
    ],
    tagline: 'без пароля —',
    stamp: 'Без пароля',
  },
};

/** Высота ряда плиток: клавиатура сжимает её до нуля */
export const TILES_HEIGHT = 84;
