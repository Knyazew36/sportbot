import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { Guide } from '@sportbot/api/entities/catalog/lib';

import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { MistakeList, StepList } from '@/shared/ui/kit/StepList';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

type CatalogGuideProps = {
  guide: Guide;
  /** Заголовок блока шагов: «Техника» у упражнения, «Как делать» у растяжки */
  title: string;
  /** Пояснение под шагами */
  note?: ReactNode;
};

// Инструкция из справочника: описание, шаги и типичные ошибки — порт widgets/catalog-guide/CatalogGuide.tsx.
// Пустые блоки не показываются. Заголовок label-секции кит не рисует — подписываем блок сами
export const CatalogGuide = ({ guide, title, note }: CatalogGuideProps) => (
  <>
    {(guide.description || guide.steps.length > 0) && (
      <ScreenSection>
        <Eyebrow tone="primary">{title}</Eyebrow>
        {guide.description ? <Text className="leading-relaxed">{guide.description}</Text> : null}
        {guide.steps.length > 0 && <StepList items={guide.steps} />}
        {note}
      </ScreenSection>
    )}
    {guide.mistakes.length > 0 && (
      <ScreenSection>
        <View className="gap-3">
          <Eyebrow tone="primary">Типичные ошибки</Eyebrow>
          <MistakeList items={guide.mistakes} />
        </View>
      </ScreenSection>
    )}
  </>
);
