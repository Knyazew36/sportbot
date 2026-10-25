import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Icon } from '@/shared/ui/kit/Icon';
import { Hatch } from '@/shared/ui/kit/Patterns';
import { Poster, Text } from '@/shared/ui/kit/Typography';

type SectionTicketProps = {
  href: Href;
  /** Номер раздела в корешке; без него — только значок (билет вне списка разделов) */
  index?: number;
  icon: LucideIcon;
  title: string;
  meta?: string;
  /** Состояние, о котором стоит помнить (пауза): синяя рамка и штриховка корешка */
  marked?: boolean;
};

// Вырез на линии отрыва — тот же корешок, что у билетов комплексов и у карты участника
const Notch = ({ className, marked }: { className: string; marked?: boolean }) => (
  <View
    className={cn(
      'bg-background absolute -left-[7px] size-3 rounded-full border-[1.5px]',
      marked ? 'border-primary' : 'border-foreground',
      className,
    )}
  />
);

// Раздел профиля — билет, порт pages/me/components/SectionTicket.tsx: корешок с номером и значком,
// линия отрыва, справа название и сводка. Это кнопка: рамка, жёсткая тень и посадка на неё при нажатии
export const SectionTicket = ({ href, index, icon, title, meta, marked }: SectionTicketProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="mr-1 mb-1"
      onPress={() => {
        haptic.tap();
        router.push(href);
      }}
    >
      {({ pressed }) => (
        <View>
          <View className={cn('absolute inset-0 translate-x-1 translate-y-1', marked ? 'bg-sb-blue' : 'bg-sb-ink')} />
          <View
            className={cn(
              'bg-background min-h-[60px] flex-row border-[1.5px]',
              marked ? 'border-primary' : 'border-foreground',
              pressed && 'translate-x-1 translate-y-1',
            )}
          >
            <View className="w-[68px] items-center justify-center gap-2 overflow-hidden py-3.5">
              {marked && <Hatch color={colors.blue} opacity={0.35} />}
              {index != null && (
                <Poster size="md" tone="primary" numeric className={cn(marked && 'bg-background px-1')}>
                  {String(index).padStart(2, '0')}
                </Poster>
              )}
              {/* Без номера значок один держит корешок — крупнее */}
              <Icon as={icon} className={cn(index != null ? 'size-5' : 'size-7', marked && 'text-primary')} />
            </View>

            <View className={cn('w-0 border-l-[1.5px] border-dashed', marked ? 'border-primary/45' : 'border-foreground/45')}>
              <Notch marked={marked} className="-top-[7px]" />
              <Notch marked={marked} className="-bottom-[7px]" />
            </View>

            <View className="min-w-0 flex-1 justify-center gap-1 py-3.5 pr-2 pl-4">
              <Poster size="sm" tone={marked ? 'primary' : 'default'}>
                {title}
              </Poster>
              {meta ? (
                <Text size="xs" tone={marked ? 'primary' : 'muted'} numberOfLines={1}>
                  {meta}
                </Text>
              ) : null}
            </View>

            <View className="justify-center pr-3">
              <Icon as={ChevronRight} className={cn('size-5 opacity-50', marked && 'text-primary')} />
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};
