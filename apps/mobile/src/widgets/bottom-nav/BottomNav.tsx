import type { MaterialTopTabBarProps } from 'expo-router/js-top-tabs';

import { Animated as RNAnimated, View } from 'react-native';

import { haptic } from '@/shared/lib/haptics';
import { useKeyboardShown } from '@/shared/lib/hooks/use-keyboard-shown';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Glass } from '@/shared/ui/kit/Glass';
import { Icon } from '@/shared/ui/kit/Icon';
import { HalftoneRing } from '@/shared/ui/kit/Patterns';
import { useScreenChrome } from '@/shared/ui/kit/screen-chrome';
import { Poster, Text } from '@/shared/ui/kit/Typography';

import { NAV_SIDES, type NavItem } from './nav';
import { Pressable } from '@/shared/ui/kit/Pressable';

type TabProps = {
  item: NavItem;
  focused: boolean;
  progress: RNAnimated.AnimatedInterpolation<number>;
  onPress: () => void;
};

// Нижнее меню — порт widgets/miniapp/BottomNav фронта: «Сегодня» — число дня по центру,
// остальные разделы делятся по бокам. Активный раздел отмечен отрезком беговой дорожки сверху.
// Низ отступает от жестовой полосы: без этого подписи уходят под системную навигацию.
// Лежит поверх страниц матовым стеклом, как во фронте: контент раздела просвечивает размытым.
// Лежит поверх страниц матовым стеклом, как во фронте: контент раздела просвечивает размытым
export const BottomNav = ({ state, emitter, navigateToTab, insets, position }: MaterialTopTabBarProps) => {
  const keyboardShown = useKeyboardShown();
  const { navTarget } = useScreenChrome();

  // Прогресс для каждого таба — по позиции пейджера, чтобы индикатор двигался
  // синхронно со свайпом, а не догонял его после смены state.index
  const tabProgress = (index: number) =>
    position.interpolate({
      inputRange: [index - 1, index, index + 1],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

  // Пока открыта клавиатура (поиск в справочнике), меню не висит над ней — как во фронте
  if (keyboardShown) return null;

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
      {items.map((item) => {
        const index = state.routes.findIndex((r) => r.name === item.name);
        return (
          <SideTab
            key={item.name}
            item={item}
            focused={item.name === focusedName}
            progress={tabProgress(index)}
            onPress={() => press(item.name)}
          />
        );
      })}
    </View>
  );

  const heroIndex = hero ? state.routes.findIndex((r) => r.name === hero.name) : -1;

  return (
    <Glass
      accessibilityRole="tabbar"
      target={navTarget}
      className="border-border absolute inset-x-0 bottom-0 flex-row border-t-[1.5px] px-1"
      style={{ paddingBottom: Math.max(8, insets.bottom) }}
    >
      {renderSide(left)}
      {hero ? (
        <HeroTab
          item={hero}
          focused={hero.name === focusedName}
          progress={tabProgress(heroIndex)}
          onPress={() => press(hero.name)}
        />
      ) : null}
      {renderSide(right)}
    </Glass>
  );
};

/** Отрезок дорожки над активным пунктом: растёт из центра синхронно со свайпом */
const Lane = ({
  progress,
  width,
  color,
}: {
  progress: RNAnimated.AnimatedInterpolation<number>;
  width: number;
  color: string;
}) => (
  <View className="absolute -top-[1.5px] h-[3px] overflow-hidden rounded-full" style={{ width }}>
    <RNAnimated.View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: color,
        transform: [{ scaleX: progress }],
      }}
    />
  </View>
);

const SideTab = ({ item, focused, progress, onPress }: TabProps) => {
  const { colors } = useTheme();
  const tone = focused ? 'text-primary' : 'text-foreground/50';
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      onPress={onPress}
      className="h-16 flex-1 items-center justify-center gap-1.5"
    >
      <Lane progress={progress} width={40} color={colors.blue} />
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
const HeroTab = ({ item, focused, progress, onPress }: TabProps) => {
  const { colors } = useTheme();
  const day = new Date().getDate();

  const ringOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8], extrapolate: 'clamp' });
  const ringScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1], extrapolate: 'clamp' });

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={item.label}
      onPress={onPress}
      className="h-16 w-[76px] items-center justify-end gap-0.5 pb-1.5"
    >
      <Lane progress={progress} width={48} color={colors.blue} />
      <View className="h-10 w-16 items-center justify-center">
        <RNAnimated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: -16, right: -16, top: -12, bottom: -12 },
            { opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        >
          <HalftoneRing color={colors.blue} />
        </RNAnimated.View>
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
