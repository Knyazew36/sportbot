import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  monospacedDigit,
  multilineTextAlignment,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { WorkoutLiveProps } from './model/types';

// Live Activity идущей тренировки: экран блокировки и Dynamic Island (iOS 16.2+).
// Функция уходит в отдельный бандл расширения: всё, что ей нужно, объявлено внутри неё, снаружи ничего не видно
const WorkoutActivityLayout = (props: WorkoutLiveProps, environment: LiveActivityEnvironment) => {
  'widget';
  // Цвета живой полосы приложения (global.css: --color-live*, --color-rest*): мятный — тренировка, абрикосовый — отдых
  const resting = props.phase === 'rest' || props.phase === 'restOver';
  const ink = '#0a0a0a';
  const paper = resting ? '#ffdcae' : '#d1ffca';
  const deep = resting ? '#ffc98a' : '#b4f5a8';
  // На тёмном фоне Dynamic Island и Always-On светлые заливки гаснут — там просто белый
  const glow = environment.isLuminanceReduced ? '#ffffff' : deep;
  const icon = resting ? 'timer' : 'figure.strengthtraining.traditional';

  const from = new Date(props.from);
  const to = props.to === null ? null : new Date(props.to);
  const pauseTime = props.pausedAt === null ? undefined : new Date(props.pausedAt);

  // Таймер тикает сам, без обновлений из приложения: вниз до конца отдыха или вверх от начала
  const timer = (size: number, color: string, width?: number) => {
    const modifiers = [
      font({ size, weight: 'bold', design: 'rounded' }),
      monospacedDigit(),
      foregroundStyle(color),
      multilineTextAlignment('trailing'),
      ...(width ? [frame({ maxWidth: width })] : []),
    ];
    return to ? (
      <Text timerInterval={{ lower: from, upper: to }} countsDown pauseTime={pauseTime} modifiers={modifiers} />
    ) : (
      <Text date={from} dateStyle="timer" modifiers={modifiers} />
    );
  };

  const progress = (color: string) =>
    to ? (
      <ProgressView timerInterval={{ lower: from, upper: to }} countsDown modifiers={[tint(color)]} />
    ) : (
      <ProgressView value={props.total ? props.done / props.total : 0} modifiers={[tint(color)]} />
    );

  const counter = props.total ? `${props.done} из ${props.total}` : '';

  return {
    banner: (
      <VStack alignment="leading" spacing={8} modifiers={[padding({ all: 16 }), activityBackgroundTint(paper)]}>
        <HStack spacing={8}>
          <Image systemName={icon} color={ink} size={15} />
          <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(ink), lineLimit(1)]}>
            {props.label}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 13 }), foregroundStyle(ink), lineLimit(1)]}>{props.title}</Text>
        </HStack>
        <HStack alignment="lastTextBaseline" spacing={12}>
          <VStack alignment="leading" spacing={2}>
            <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundStyle(ink), lineLimit(2)]}>
              {props.exercise}
            </Text>
            {props.step ? (
              <Text modifiers={[font({ size: 14 }), foregroundStyle(ink), lineLimit(1)]}>{props.step}</Text>
            ) : null}
          </VStack>
          <Spacer />
          {timer(34, ink)}
        </HStack>
        <HStack spacing={8}>
          {progress(ink)}
          {counter && !to ? (
            <Text modifiers={[font({ size: 12 }), monospacedDigit(), foregroundStyle(ink)]}>{counter}</Text>
          ) : null}
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName={icon} color={glow} />,
    compactTrailing: timer(15, glow, 56),
    minimal: <Image systemName={icon} color={glow} />,
    expandedLeading: (
      <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 4 })]}>
        <Image systemName={icon} color={glow} size={22} />
        <Text modifiers={[font({ size: 12 }), foregroundStyle(glow), lineLimit(1)]}>{props.label}</Text>
      </VStack>
    ),
    expandedTrailing: <VStack modifiers={[padding({ trailing: 4 })]}>{timer(30, glow, 120)}</VStack>,
    expandedBottom: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ horizontal: 4 })]}>
        <Text modifiers={[font({ size: 16, weight: 'semibold' }), lineLimit(1)]}>{props.exercise}</Text>
        <HStack>
          <Text modifiers={[font({ size: 13 }), foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>
            {props.step}
          </Text>
          <Spacer />
          <Text
            modifiers={[
              font({ size: 13 }),
              monospacedDigit(),
              foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
            ]}
          >
            {counter}
          </Text>
        </HStack>
        {progress(glow)}
      </VStack>
    ),
  };
};

export const WorkoutActivity = createLiveActivity('WorkoutActivity', WorkoutActivityLayout);
