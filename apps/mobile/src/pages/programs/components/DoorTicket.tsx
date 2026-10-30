import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { Halftone } from '@/shared/ui/kit/Patterns';
import { Pressable } from '@/shared/ui/kit/Pressable';
import { Poster, Text } from '@/shared/ui/kit/Typography';

const STUB_TONE = {
  ink: 'bg-foreground',
  blue: 'bg-primary',
  draft: '',
} as const;

const MARK_TONE = {
  ink: 'text-background',
  blue: 'text-primary-foreground',
  draft: 'text-foreground',
} as const;

type DoorTicketProps = {
  /** Крупный знак на корешке: число или значок (значок красим сами, цвет здесь не наследуется) */
  mark: ReactNode;
  title: ReactNode;
  meta: ReactNode;
  /** Цвет корешка: draft — пунктирный билет ещё не созданной программы */
  tone: keyof typeof STUB_TONE;
  onPress: () => void;
  disabled?: boolean;
};

// Переход к другой программе — порт pages/programs/components/DoorTicket.tsx. Линия отрыва сплошная:
// пунктир на одной стороне рамки RN рисует не везде
export const DoorTicket = ({ mark, title, meta, tone, onPress, disabled }: DoorTicketProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn('mr-[3px] mb-[3px]', disabled && 'opacity-60')}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      {({ pressed }) => (
        <View>
          <View className="bg-sb-ink absolute inset-0 translate-x-[3px] translate-y-[3px]" />
          <View
            className={cn(
              'border-foreground bg-card flex-row items-stretch border-[1.5px]',
              tone === 'draft' && 'border-dashed',
              pressed && 'translate-x-[3px] translate-y-[3px]',
            )}
          >
            {/* Растровый угол — фирменная фактура плаката */}
            <View pointerEvents="none" className="absolute -top-2 -right-2 size-16 opacity-30">
              <Halftone color={colors.ink} />
            </View>
            <View
              className={cn('border-foreground w-[72px] shrink-0 items-center justify-center border-r-[1.5px] py-4', STUB_TONE[tone])}
            >
              {typeof mark === 'number' ? (
                <Poster size="xl" numeric className={MARK_TONE[tone]}>
                  {mark}
                </Poster>
              ) : (
                mark
              )}
            </View>
            {/* Вырезы линии отрыва: сверху и снизу, как корешок у билетов очереди */}
            <View className="bg-background border-foreground absolute -top-[7px] left-[65px] size-3 rounded-full border-[1.5px]" />
            <View className="bg-background border-foreground absolute -bottom-[7px] left-[65px] size-3 rounded-full border-[1.5px]" />
            <View className="min-w-0 flex-1 justify-center gap-1 py-3 pr-2 pl-4">
              <Poster size="sm">{title}</Poster>
              <Text size="xs" tone="muted">
                {meta}
              </Text>
            </View>
            <Icon as={ArrowRight} strokeWidth={2.5} className="text-foreground mr-3 size-5 self-center" />
          </View>
        </View>
      )}
    </Pressable>
  );
};
