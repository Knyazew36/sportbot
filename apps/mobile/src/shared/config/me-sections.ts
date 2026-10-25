import { BellRing, Clapperboard, HeartPulse, type LucideIcon, Palette, UserRound, UsersRound } from 'lucide-react-native';

export type MeSectionSlug = 'training' | 'body' | 'friends' | 'account' | 'app' | 'editor';

export type MeSection = {
  slug: MeSectionSlug;
  title: string;
  icon: LucideIcon;
};

// Разделы профиля — порт shared/config/me-sections.ts: меню (/me) показывает кнопки, экран раздела
// (/me/[section]) — их пункты. Порядок — по частоте: тренировки трогают каждую неделю, аккаунт — почти никогда
export const ME_SECTIONS: MeSection[] = [
  { slug: 'training', title: 'Тренировки', icon: BellRing },
  { slug: 'body', title: 'Тело', icon: HeartPulse },
  { slug: 'friends', title: 'Друзья', icon: UsersRound },
  { slug: 'account', title: 'Аккаунт', icon: UserRound },
  { slug: 'app', title: 'Оформление', icon: Palette },
  { slug: 'editor', title: 'Редактор', icon: Clapperboard },
];

export const findMeSection = (slug: string | undefined): MeSection | undefined =>
  ME_SECTIONS.find((section) => section.slug === slug);
