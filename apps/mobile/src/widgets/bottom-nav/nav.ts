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

const HERO = NAV_ITEMS.find((item) => item.hero);
const REST = NAV_ITEMS.filter((item) => item !== HERO);

/** Раскладка меню: «Сегодня» по центру, остальные поровну по бокам */
export const NAV_SIDES = {
  hero: HERO,
  left: REST.slice(0, Math.floor(REST.length / 2)),
  right: REST.slice(Math.floor(REST.length / 2)),
};

// Порядок страниц пейджера = порядок пунктов в меню слева направо, иначе свайп уводит не в соседний пункт
export const TAB_ORDER: NavItem[] = [...NAV_SIDES.left, ...(HERO ? [HERO] : []), ...NAV_SIDES.right];

/** Открыт сам раздел меню: только на них видно нижнее меню, всё остальное — в стеке поверх табов */
export const isTabPath = (pathname: string) => NAV_ITEMS.some((item) => pathname === `/${item.name}`);
