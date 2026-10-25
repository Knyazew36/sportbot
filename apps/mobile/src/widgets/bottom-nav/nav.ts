import { BookOpen, ChartNoAxesColumn, Layers, type LucideIcon, Target, UserRound } from 'lucide-react-native';

export type NavItem = {
  /** Имя маршрута таба в (tabs)/_layout */
  name: string;
  label: string;
  icon: LucideIcon;
  /** Главный раздел: число дня по центру меню */
  hero?: boolean;
};

// Разделы нижнего меню — как MINIAPP_NAV во фронте (frontend-tz, раздел 6). «Сегодня» по центру,
// остальные слева направо. Раздела «Админ» в приложении нет (MOBILE_TZ.md)
export const NAV_ITEMS: NavItem[] = [
  { name: 'today', label: 'Сегодня', icon: Target, hero: true },
  { name: 'library', label: 'Справочник', icon: BookOpen },
  { name: 'programs', label: 'Программы', icon: Layers },
  { name: 'stats', label: 'Статистика', icon: ChartNoAxesColumn },
  { name: 'me', label: 'Профиль', icon: UserRound },
];

// Вложенные экраны со своей кнопкой «Назад» — без меню, как focus во фронте
const FOCUS_PATTERNS = [/^\/library\/exercises\//, /^\/me\/[^/]+/];

export const isFocusPath = (pathname: string) => FOCUS_PATTERNS.some((pattern) => pattern.test(pathname));
