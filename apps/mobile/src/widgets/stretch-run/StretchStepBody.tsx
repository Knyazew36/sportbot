import type { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';

import { stretchGuide } from '@sportbot/api/entities/catalog/lib';
import type { CooldownStretch } from '@sportbot/api/entities/workout';
import { toAssetUrl } from '@/shared/api';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { Rise } from '@/shared/ui/kit/Reveal';
import { StepList } from '@/shared/ui/kit/StepList';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { ImageCredit } from '@/widgets/catalog/ImageCredit';

import { SideTrack } from './SideTrack';

/** Ниже этой высоты экрана фото позы прячем ради таймера — [@media(max-height:620px)]:hidden фронта */
const PHOTO_MIN_HEIGHT = 620;

type StretchStepBodyProps = {
  stretch: CooldownStretch;
  side: 1 | 2;
  eyebrow: string;
  /** Кнопки под названием: у заминки и отдельного занятия они разные */
  actions: ReactNode;
};

// Одна растяжка на экране прохождения: фото позы, что тянет, сторона и шаги
export const StretchStepBody = ({ stretch, side, eyebrow, actions }: StretchStepBodyProps) => {
  const { height } = useWindowDimensions();
  const { steps } = stretchGuide(stretch);
  return (
    <>
      {/* Старт и финиш рядом: поза читается без видео. На низком экране фото прячем ради таймера */}
      {height >= PHOTO_MIN_HEIGHT && (
        <Rise className="gap-1.5">
          <PhotoPair start={toAssetUrl(stretch.imageUrl) ?? null} end={toAssetUrl(stretch.imageEndUrl) ?? null} alt={stretch.name} />
          <ImageCredit credit={stretch.imageCredit} />
        </Rise>
      )}
      <Rise>
        <Eyebrow tone="primary">{eyebrow}</Eyebrow>
        <Poster size="2xl" className="mt-2">
          {stretch.name}
        </Poster>
        {stretch.feel && (
          <Text tone="soft" className="mt-2">
            Тянет: {stretch.feel}
          </Text>
        )}
        <View className="mt-3 flex-row flex-wrap gap-2">{actions}</View>
      </Rise>
      {stretch.perSide && (
        <Rise>
          <SideTrack side={side} />
        </Rise>
      )}
      {/* Ошибки и видео — в «Подробнее»: на полу с экрана читают только как встать */}
      {steps.length > 0 && (
        <Rise className="pb-4">
          <StepList items={steps} size="lg" />
        </Rise>
      )}
    </>
  );
};
