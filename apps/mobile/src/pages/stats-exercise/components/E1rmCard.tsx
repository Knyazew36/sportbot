import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react-native';

import type { StatsE1rmSetResponseDto } from '@sportbot/api/generated/model';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { Hatch } from '@/shared/ui/kit/Patterns';
import { Eyebrow, Lead, Poster, Unit } from '@/shared/ui/kit/Typography';

import { FLAT_KG, kg, ROUGH_REPS } from '../model/e1rm';
import { Pressable } from '@/shared/ui/kit/Pressable';

type E1rmCardProps = {
  e1rm: StatsE1rmSetResponseDto;
  label: string;
  trend: number | null;
  periodText: string;
  onOpen: () => void;
};

const Trend = ({ trend, periodText }: { trend: number; periodText: string }) => {
  const direction = trend >= FLAT_KG ? 'up' : trend <= -FLAT_KG ? 'down' : 'flat';
  const TrendIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : ArrowRight;

  return (
    <View
      className={cn(
        'shrink-0 items-end',
        direction === 'up' ? 'text-primary' : direction === 'down' ? 'text-destructive' : 'text-muted-foreground',
      )}
    >
      <View className="flex-row items-center gap-0.5">
        <Icon
          as={TrendIcon}
          className={cn(
            'size-6',
            direction === 'up' ? 'text-primary' : direction === 'down' ? 'text-destructive' : 'text-muted-foreground',
          )}
          strokeWidth={2.5}
        />
        <Poster size="sm" numeric>
          {direction === 'flat' ? '0' : `${trend > 0 ? '+' : '−'}${kg(Math.abs(trend))}`}
        </Poster>
      </View>
      <Eyebrow size="sm" tone="inherit">
        {direction === 'flat' ? 'на месте' : 'кг'} {periodText}
      </Eyebrow>
    </View>
  );
};

export const E1rmCard = ({ e1rm, label, trend, periodText, onOpen }: E1rmCardProps) => {
  const { colors } = useTheme();

  return (
    <View className="mr-[3px] mb-[3px]">
      <View className="bg-primary absolute inset-0 translate-x-[3px] translate-y-[3px]" />
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          haptic.tap();
          onOpen();
        }}
        className="border-primary bg-sb-tint relative flex-row border-[1.5px] border-dashed active:translate-x-[3px] active:translate-y-[3px]"
      >
        <View className="border-primary w-4 border-r-[1.5px] border-dashed">
          <Hatch color={colors.hatch} />
        </View>
        <View className="min-w-0 flex-1 gap-1 p-3 pr-4">
          <Lead size="sm" tone="primary">
            расчётный максимальный вес
          </Lead>
          <View className="flex-row items-end justify-between gap-3">
            <Poster size="2xl" numeric fit className="min-w-0 shrink">
              <Poster size="2xl" tone="primary">
                ≈
              </Poster>
              {kg(e1rm.value)}
              <Unit>кг</Unit>
            </Poster>
            {trend != null && <Trend trend={trend} periodText={periodText} />}
          </View>
          <View className="flex-row items-end justify-between gap-3">
            <Eyebrow size="sm" className="min-w-0 shrink">
              {label} · из {kg(e1rm.weight)} кг × {e1rm.reps}
              {e1rm.reps > ROUGH_REPS && ' · грубо'}
            </Eyebrow>
            <View className="shrink-0 flex-row items-center">
              <Eyebrow size="sm" tone="primary">
                как считается
              </Eyebrow>
              <Icon as={ChevronRight} className="text-primary size-3.5" />
            </View>
          </View>
        </View>
      </Pressable>
      <Animated.View
        entering={FadeIn.delay(450)}
        className="border-primary bg-background absolute -top-2.5 right-3 border-2 px-1.5 py-0.5"
        style={{ transform: [{ rotate: '-7deg' }] }}
      >
        <Poster size="xs" tone="primary" className="tracking-[0.04em]">
          на раз
        </Poster>
      </Animated.View>
    </View>
  );
};
