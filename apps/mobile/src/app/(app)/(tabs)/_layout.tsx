import { usePathname } from 'expo-router';
import { TopTabs } from 'expo-router/js-top-tabs';

import { BottomNav } from '@/widgets/bottom-nav/BottomNav';
import { isFocusPath, TAB_ORDER } from '@/widgets/bottom-nav/nav';

// Нижнее меню: Справочник, Программы, Сегодня по центру, Статистика, Профиль (frontend-tz, раздел 6).
// Разделы — страницы пейджера: листаются свайпом вбок в том же порядке, что пункты меню.
// Разметка меню своя — порт фронтового BottomNav. Тренировка открывается поверх табов полноэкранно — в (app)/_layout
export default function LayoutTabs() {
  const pathname = usePathname();

  return (
    <TopTabs
      tabBarPosition="bottom"
      tabBar={(props) => <BottomNav {...props} />}
      // «Назад» из любого раздела ведёт на «Сегодня», а не на первую страницу пейджера (Справочник)
      backBehavior="initialRoute"
      // На вложенных экранах раздела свайп вбок — это «Назад» стека, а не переход в соседний раздел
      screenOptions={{  swipeEnabled: !isFocusPath(pathname) }}
      // screenOptions={{ lazy: true, swipeEnabled: !isFocusPath(pathname) }}
    >
      {TAB_ORDER.map((item) => (
        <TopTabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
      ))}
    </TopTabs>
  );
}

// Страницы пейджера идут в порядке меню, а открываться приложение должно на «Сегодня» в центре
export const unstable_settings = { initialRouteName: 'today' };
