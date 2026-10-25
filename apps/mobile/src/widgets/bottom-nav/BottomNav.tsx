import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';

import { haptic } from '@/shared/lib/haptics';
import { useKeyboardShown } from '@/shared/lib/hooks/use-keyboard-shown';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { HalftoneRing } from '@/shared/ui/kit/Patterns';
import { Poster, Text } from '@/shared/ui/kit/Typography';

import { isFocusPath, NAV_SIDES, type NavItem } from './nav';

// Плавный выход, как ease-[cubic-bezier(0.22,1,0.36,1)] во фронте
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

type TabProps = { item: NavItem; focused: boolean; onPress: () => void };

// Нижнее меню — порт widgets/miniapp/BottomNav фронта: «Сегодня» — число дня по центру,
// остальные разделы делятся по бокам. Активный раздел отмечен отрезком беговой дорожки сверху.
// Низ отступает от жестовой полосы: без этого подписи уходят под системную навигацию
export const BottomNav = ({ state, emitter, navigateToTab, insets }: MaterialTopTabBarProps) => {
  const pathname = usePathname();
  const keyboardShown = useKeyboardShown();

  // Пока открыта клавиатура (поиск в справочнике), меню не висит над ней — как во фронте
  if (keyboardShown || isFocusPath(pathname)) return null;

  const focusedName = state.routes[state.index]?.name;

  const press = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (name === focusedName || event.defaultPrevented) return;
    // По уже открытому разделу — без вибрации
    haptic.tap();
    navigateToTab(route.key);
  };

  const { hero, left, right } = NAV_SIDES;

  const renderSide = (items: NavItem[]) => (
    <View className="flex-1 flex-row">
      {items.map((item) => (
        <SideTab key={item.name} item={item} focused={item.name === focusedName} onPress={() => press(item.name)} />
      ))}
    </View>
  );

  return (
    <View
      accessibilityRole="tabbar"
      className="border-border bg-background flex-row border-t-[1.5px] px-1"
      style={{ paddingBottom: Math.max(8, insets.bottom) }}
    >
      {renderSide(left)}
      {hero ? <HeroTab item={hero} focused={hero.name === focusedName} onPress={() => press(hero.name)} /> : null}
      {renderSide(right)}
    </View>
  );
};

/** Отрезок дорожки над активным пунктом: растёт из центра */
const Lane = ({ focused, width }: { focused: boolean; width: number }) => {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 300 });
  }, [focused, progress]);

  const style = useAnimatedStyle(() => ({ width: width * progress.value }));

  return <Animated.View className="bg-primary absolute -top-[1.5px] h-[3px] rounded-full" style={style} />;
};

const SideTab = ({ item, focused, onPress }: TabProps) => {
  const tone = focused ? 'text-primary' : 'text-foreground/50';
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      onPress={onPress}
      className="h-16 flex-1 items-center justify-center gap-1.5"
    >
      <Lane focused={focused} width={40} />
      <Icon as={item.icon} className={cn('size-[22px]', tone)} strokeWidth={focused ? 2.2 : 1.6} />
      {/* Два пункта на половине ширины («Справочник», «Статистика») на 375px помещаются только мелко */}
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} className={cn('text-[10.5px] leading-[12px]', tone)}>
        {item.label}
      </Text>
    </Pressable>
  );
};

// «Сегодня»: вместо иконки — сегодняшнее число плакатным шрифтом, кнопка буквально про этот день.
// Открытый раздел — дорожка сверху и растр печатного плаката кольцом вокруг цифры.
// Дата берётся при отрисовке: меню перерисовывается на каждом переходе
const HeroTab = ({ item, focused, onPress }: TabProps) => {
  const { colors } = useTheme();
  const day = new Date().getDate();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 500, easing: EASE_OUT });
  }, [focused, progress]);

  const halftone = useAnimatedStyle(() => ({
    opacity: progress.value * 0.8,
    transform: [{ scale: 0.75 + 0.25 * progress.value }],
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      onPress={onPress}
      className="h-16 w-[76px] items-center justify-end gap-0.5 pb-1.5"
    >
      <Lane focused={focused} width={48} />
      <View className="h-10 w-16 items-center justify-center">
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: -16, right: -16, top: -12, bottom: -12 }, halftone]}>
          <HalftoneRing color={colors.blue} />
        </Animated.View>
        <Poster
          maxFontSizeMultiplier={1}
          className={cn('pt-1 text-[30px] leading-[30px]', focused ? 'text-primary' : 'text-foreground')}
        >
          {String(day)}
        </Poster>
      </View>
      <Poster
        numberOfLines={1}
        maxFontSizeMultiplier={1}
        className={cn('text-[13px] leading-[13px] tracking-[0.8px]', focused ? 'text-primary' : 'text-foreground/70')}
      >
        {item.label}
      </Poster>
    </Pressable>
  );
};
