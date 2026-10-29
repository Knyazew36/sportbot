import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TopTabs } from 'expo-router/js-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useKeyboardShown } from '@/shared/lib/hooks/use-keyboard-shown';
import { type BlurTarget, ScreenChromeProvider } from '@/shared/ui/kit/screen-chrome';
import { BottomNav } from '@/widgets/bottom-nav/BottomNav';
import { navHeight, TAB_ORDER } from '@/widgets/bottom-nav/nav';

// Нижнее меню: Справочник, Программы, Сегодня по центру, Статистика, Профиль (frontend-tz, раздел 6).
// Разделы — страницы пейджера: листаются свайпом вбок в том же порядке, что пункты меню.
// Разметка меню своя — порт фронтового BottomNav. Всё, куда уходят с разделов (экраны программ, упражнения,
// тренировка), — в стеке (app)/_layout поверх табов, без меню; здесь только пять страниц.
// Меню лежит поверх страниц: экраны узнают его высоту, а меню — контент открытого раздела для размытия
export default function LayoutTabs() {
  const insets = useSafeAreaInsets();
  const keyboardShown = useKeyboardShown();
  const [navTarget, setNavTarget] = useState<BlurTarget | null>(null);

  // Отписка снимает цель, только если её ещё не заняла следующая страница: фокус меняется раньше размонтирования
  const registerNavTarget = useCallback((target: BlurTarget) => {
    setNavTarget(target);
    return () => setNavTarget((current) => (current === target ? null : current));
  }, []);

  // Под клавиатурой меню прячется — низ экрана опускается на его место
  const chrome = useMemo(
    () => ({ navHeight: keyboardShown ? 0 : navHeight(insets.bottom), navTarget, registerNavTarget }),
    [keyboardShown, insets.bottom, navTarget, registerNavTarget],
  );

  return (
    <ScreenChromeProvider value={chrome}>
      <View className="flex-1">
        <TopTabs
          tabBarPosition="bottom"
          tabBar={(props) => <BottomNav {...props} />}
          // Прыжок по тапу через несколько разделов — без анимации пролистывания пейджера:
          // иначе позиция проходит через промежуточные страницы и «Сегодня» на мгновение
          // проигрывает свою анимацию. Свайп жестом и движение индикатора это не трогает
          screenOptions={{ animationEnabled: false }}
          // «Назад» из любого раздела ведёт на «Сегодня», а не на первую страницу пейджера (Справочник)
          backBehavior="initialRoute"
        >
          {TAB_ORDER.map((item) => (
            <TopTabs.Screen key={item.name} name={item.name} options={{ title: item.label }} />
          ))}
        </TopTabs>
      </View>
    </ScreenChromeProvider>
  );
}

// Страницы пейджера идут в порядке меню, а открываться приложение должно на «Сегодня» в центре
export const unstable_settings = { anchor: 'today' };
