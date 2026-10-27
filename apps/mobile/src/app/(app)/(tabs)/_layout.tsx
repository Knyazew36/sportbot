import { View } from 'react-native';
import { TopTabs } from 'expo-router/js-top-tabs';

import { BottomNav } from '@/widgets/bottom-nav/BottomNav';
import { TAB_ORDER } from '@/widgets/bottom-nav/nav';

// Нижнее меню: Справочник, Программы, Сегодня по центру, Статистика, Профиль (frontend-tz, раздел 6).
// Разделы — страницы пейджера: листаются свайпом вбок в том же порядке, что пункты меню.
// Разметка меню своя — порт фронтового BottomNav. Всё, куда уходят с разделов (экраны программ, упражнения,
// тренировка), — в стеке (app)/_layout поверх табов, без меню; здесь только пять страниц
export default function LayoutTabs() {
  return (
    <View className="flex-1">
      <TopTabs
        tabBarPosition="bottom"
        tabBar={(props) => <BottomNav {...props} />}
        // «Назад» из любого раздела ведёт на «Сегодня», а не на первую страницу пейджера (Справочник)
        backBehavior="initialRoute"
      >
        {TAB_ORDER.map((item) => (
          <TopTabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
        ))}
      </TopTabs>
    </View>
  );
}

// Страницы пейджера идут в порядке меню, а открываться приложение должно на «Сегодня» в центре
export const unstable_settings = { anchor: 'today' };
