import { View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { FadeIn, interpolate, Keyframe, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';

import { APP_NAME } from '@/shared/config/app';
import { cn } from '@/shared/lib/utils';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';

import { HERO, TILES_HEIGHT, type AuthHeroKind, type HeroTile } from '../hero';

const TILE_TONE = {
  plain: 'border-background/30',
  work: 'bg-mint border-mint',
  rest: 'bg-rest border-rest',
} as const;

// Печать ставится после плиток: крупно и с поворотом → на место
const STAMP_IN = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 2.4 }, { rotate: '-14deg' }] },
  70: { opacity: 1, transform: [{ scale: 0.96 }, { rotate: '-5deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '-6deg' }] },
})
  .delay(500)
  .duration(320);

const Tile = ({ tile, index, still }: { tile: HeroTile; index: number; still: boolean }) => {
  const filled = tile.tone !== 'plain';
  return (
    <Animated.View
      entering={still ? FadeIn.duration(150) : FadeIn.duration(300).delay(index * 60)}
      className={cn('flex-1 justify-between border-2 px-2.5 py-2', TILE_TONE[tile.tone])}
      style={{ height: TILES_HEIGHT }}
    >
      <Poster size="xl" numberOfLines={1} className={filled ? 'text-sb-ink' : undefined}>
        {tile.value}
      </Poster>
      <Eyebrow
        size="sm"
        numberOfLines={1}
        tone={filled ? 'default' : 'inverseMuted'}
        className={filled ? 'text-sb-ink' : undefined}
      >
        {tile.label}
      </Eyebrow>
    </Animated.View>
  );
};

type AuthHeroProps = { kind: AuthHeroKind };

// Чёрная плашка-«бланк» над формой: плитки-цифры и штамп. При клавиатуре плитки схлопываются —
// высота идёт от progress, а не от флага, чтобы раскладка не прыгала вместе с докруткой поля
export const AuthHero = ({ kind }: AuthHeroProps) => {
  const config = HERO[kind];
  const still = useReducedMotion();
  const { progress } = useReanimatedKeyboardAnimation();

  const tilesStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [TILES_HEIGHT + 12, 0], 'clamp'),
    opacity: interpolate(progress.value, [0, 0.6], [1, 0], 'clamp'),
    overflow: 'hidden',
  }));

  return (
    <InkPanel shadow className="px-4 pt-4 pb-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="bg-sb-blue size-2.5" />
          <Eyebrow tone="inverse">{APP_NAME}</Eyebrow>
        </View>
        <Eyebrow size="sm" tone="inverseMuted">
          Telegram · MAX
        </Eyebrow>
      </View>

      <Animated.View style={tilesStyle}>
        <View className="mt-3 flex-row gap-2">
          {config.tiles.map((tile, i) => (
            <Tile key={tile.label} tile={tile} index={i} still={still} />
          ))}
        </View>
      </Animated.View>

      <Lead size="md" tone="inverseMuted" className="mt-3 max-w-[60%]">
        {config.tagline}
      </Lead>

      {config.stamp ? (
        <View pointerEvents="none" className="absolute right-3 bottom-3">
          <Animated.View
            entering={still ? FadeIn.duration(150) : STAMP_IN}
            style={{ transform: [{ rotate: '-6deg' }] }}
            className="mr-1 mb-1"
          >
            <View className="bg-sb-blue absolute inset-0 translate-x-1 translate-y-1" />
            <View className="bg-sb-paper border-sb-ink border-2 px-2.5 py-1">
              <Poster size="sm" numberOfLines={1} className="text-sb-ink">
                {config.stamp}
              </Poster>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </InkPanel>
  );
};
