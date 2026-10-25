import type { ComponentProps, ReactNode } from 'react';
import { Platform, View } from 'react-native';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

import { cn } from '@/shared/lib/utils';

import { Poster, Text } from './Typography';

// Диалог подтверждения — AlertDialog из React Native Reusables (Uniwind) со стилем shared/ui/shadcn/alert-dialog фронта:
// плакатный заголовок, рамка и синяя жёсткая тень. Рисуется в PortalHost корневого лейаута — поверх шторок тоже

export const AlertDialog = AlertDialogPrimitive.Root;

// На iOS модальный экран (тренировка) перекрыл бы портал — FullWindowOverlay поднимает диалог над всем окном
const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : ({ children }: { children: ReactNode }) => children;

export const AlertDialogContent = ({
  className,
  children,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) => (
  <AlertDialogPrimitive.Portal>
    <FullWindowOverlay>
      <AlertDialogPrimitive.Overlay className="absolute inset-0 z-50 items-center justify-center bg-black/40 p-4">
        <Animated.View
          entering={FadeIn.duration(150).reduceMotion(ReduceMotion.System)}
          exiting={FadeOut.duration(100).reduceMotion(ReduceMotion.System)}
          style={{ width: '100%', maxWidth: 320 }}
        >
          <AlertDialogPrimitive.Content {...props} className="mr-1.5 mb-1.5">
            <View className="bg-sb-blue absolute inset-0 translate-x-1.5 translate-y-1.5" />
            <View className={cn('border-foreground bg-popover gap-6 border-[1.5px] p-6', className)}>{children}</View>
          </AlertDialogPrimitive.Content>
        </Animated.View>
      </AlertDialogPrimitive.Overlay>
    </FullWindowOverlay>
  </AlertDialogPrimitive.Portal>
);

export const AlertDialogHeader = ({ children }: { children: ReactNode }) => (
  <View className="items-center gap-1.5">{children}</View>
);

export const AlertDialogFooter = ({ children }: { children: ReactNode }) => (
  <View className="flex-col-reverse gap-2">{children}</View>
);

export const AlertDialogTitle = ({ children }: { children: ReactNode }) => (
  <AlertDialogPrimitive.Title asChild>
    <Poster className="text-center text-[26px] leading-[27px]">{children}</Poster>
  </AlertDialogPrimitive.Title>
);

export const AlertDialogDescription = ({ children }: { children: ReactNode }) => (
  <AlertDialogPrimitive.Description asChild>
    <Text size="sm" tone="muted" className="text-center">
      {children}
    </Text>
  </AlertDialogPrimitive.Description>
);
