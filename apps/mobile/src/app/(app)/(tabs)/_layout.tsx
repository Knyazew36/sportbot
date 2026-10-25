import { Tabs } from 'expo-router/js-tabs';

import { BottomNav } from '@/widgets/bottom-nav/BottomNav';
import { NAV_ITEMS } from '@/widgets/bottom-nav/nav';

// Нижнее меню: Справочник, Программы, Сегодня по центру, Статистика, Профиль (frontend-tz, раздел 6).
// Разметка меню своя — порт фронтового BottomNav. Тренировка открывается поверх табов полноэкранно — в (app)/_layout
export default function LayoutTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BottomNav {...props} />}>
      {NAV_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
      ))}
    </Tabs>
  );
}
