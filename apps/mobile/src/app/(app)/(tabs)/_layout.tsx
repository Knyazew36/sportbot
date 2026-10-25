import { View } from 'react-native';
import { usePathname } from 'expo-router';
import { TopTabs } from 'expo-router/js-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UndoBar } from '@/shared/ui/kit/UndoBar';
import { BottomNav } from '@/widgets/bottom-nav/BottomNav';
import { CurrentWorkoutBar } from '@/widgets/live-workout-bar/CurrentWorkoutBar';
import { isFocusPath, TAB_ORDER } from '@/widgets/bottom-nav/nav';

// Высота пунктов меню (h-16 в BottomNav) — плашка отмены встаёт над ним
const NAV_ROW = 64;

// Нижнее меню: Справочник, Программы, Сегодня по центру, Статистика, Профиль (frontend-tz, раздел 6).
// Разделы — страницы пейджера: листаются свайпом вбок в том же порядке, что пункты меню.
// Разметка меню своя — порт фронтового BottomNav. Тренировка открывается поверх табов полноэкранно — в (app)/_layout
export default function LayoutTabs() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const focus = isFocusPath(pathname);
  // Над меню, если оно есть, иначе над жестовой полосой — как navVisible у UndoBar фронта
  const undoBottom = focus ? Math.max(16, insets.bottom + 8) : NAV_ROW + Math.max(8, insets.bottom) + 12;

  return (
    <View className="flex-1">
      <CurrentWorkoutBar>
      <TopTabs
        tabBarPosition="bottom"
        tabBar={(props) => <BottomNav {...props} />}
        // «Назад» из любого раздела ведёт на «Сегодня», а не на первую страницу пейджера (Справочник)
        backBehavior="initialRoute"
        // На вложенных экранах раздела свайп вбок — это «Назад» стека, а не переход в соседний раздел
        screenOptions={{ swipeEnabled: !focus }}
        // screenOptions={{ lazy: true, swipeEnabled: !isFocusPath(pathname) }}
      >
        {TAB_ORDER.map((item) => (
          <TopTabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
        ))}
      </TopTabs>
      </CurrentWorkoutBar>
      <UndoBar bottom={undoBottom} />
    </View>
  );
}

// Страницы пейджера идут в порядке меню, а открываться приложение должно на «Сегодня» в центре
export const unstable_settings = { initialRouteName: 'today' };
