import { useWindowDimensions, View } from 'react-native';
import { Ban, Info, List, SkipBack, SkipForward } from 'lucide-react-native';

import { stretchGuide } from '@sportbot/api/entities/catalog/lib';
import { toAssetUrl } from '@/shared/api';
import { timerEndSignal } from '@/shared/lib/signal';
import { Button } from '@/shared/ui/kit/Button';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { MistakeList, StepList } from '@/shared/ui/kit/StepList';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { HoldControls } from '@/widgets/catalog/HoldControls';
import { ImageCredit } from '@/widgets/catalog/ImageCredit';
import { VideoLink } from '@/widgets/catalog/VideoLink';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownProgress } from './CooldownProgress';
import { CooldownDetailSheet, CooldownListSheet } from './CooldownSheets';
import { SideTrack } from './SideTrack';

/** Ниже этой высоты экрана фото позы прячем ради таймера — [@media(max-height:620px)]:hidden фронта */
const PHOTO_MIN_HEIGHT = 620;

type CooldownStepProps = {
  flow: CooldownFlow;
  index: number;
  side: 1 | 2;
};

// Одна растяжка: фото позы, шаги, ошибки и таймер удержания. Следующую человек открывает сам
export const CooldownStep = ({ flow, index, side }: CooldownStepProps) => {
  const { height } = useWindowDimensions();
  const { cooldown, all } = flow;
  const stretch = all[index];
  // Растяжку убрали без замены, номер шага поправится следующим рендером
  if (!stretch) return null;
  const { steps, mistakes } = stretchGuide(stretch);
  const inMain = index < cooldown.main.length;
  const isLast =
    (index === all.length - 1 || (inMain && index === cooldown.main.length - 1)) && (!stretch.perSide || side === 2);
  const key = `${index}-${stretch.id}-${side}`;

  return (
    <Screen
      key={`screen-${key}`}
      fullscreen
      header={
        <>
          <TopBar
            back={flow.finish}
            title="Заминка"
            subtitle={`растяжка ${index + 1} из ${all.length} · ~${cooldown.minutes} мин`}
            action={
              <View className="flex-row items-center gap-2">
                {/* Шторка поверх: таймер удержания под ней продолжает идти */}
                <Button variant="alert" size="icon" accessibilityLabel="Карточка растяжки" onPress={() => flow.open(stretch)}>
                  <Icon as={Info} className="size-5" />
                </Button>
                <Button variant="alert" size="icon" accessibilityLabel="Весь список" onPress={() => flow.setListOpen(true)}>
                  <Icon as={List} className="size-5" />
                </Button>
                {/* Заминка не влияет на засчитывание — выйти можно в любой момент без подтверждения */}
                <Button variant="destructive" size="sm" contentClassName="h-10" onPress={flow.finish}>
                  Завершить
                </Button>
              </View>
            }
          />
          <CooldownProgress ids={all.map((s) => s.id)} current={index} mainCount={cooldown.main.length} />
        </>
      }
      footer={
        // Ключи соседей разные: одинаковые сломали бы сверку React и старый таймер остался бы рядом с новым
        <HoldControls
          key={`hold-${key}`}
          holdSeconds={stretch.holdSeconds}
          side={stretch.perSide ? side : undefined}
          back={{ label: 'Назад', icon: SkipBack, onPress: flow.prev }}
          next={{
            label: stretch.perSide && side === 1 ? 'Левая' : isLast ? 'Готово' : 'Дальше',
            icon: SkipForward,
            onPress: flow.next,
          }}
          // Без автоперехода: следующую растяжку человек открывает сам, когда прочитал и готов
          onEnd={() => timerEndSignal(cooldown)}
        />
      }
      className="gap-5 px-gutter pt-4"
    >
      {/* Старт и финиш рядом: поза читается без видео. На низком экране фото прячем ради таймера */}
      {height >= PHOTO_MIN_HEIGHT && (
        <Rise className="gap-1.5">
          <PhotoPair start={toAssetUrl(stretch.imageUrl) ?? null} end={toAssetUrl(stretch.imageEndUrl) ?? null} alt={stretch.name} />
          <ImageCredit credit={stretch.imageCredit} />
        </Rise>
      )}
      <Rise>
        <Eyebrow tone="primary">
          {inMain ? 'Основной блок' : 'Если есть время'} · {stretch.muscles}
        </Eyebrow>
        <Poster size="2xl" className="mt-2">
          {stretch.name}
        </Poster>
        {stretch.feel && (
          <Text tone="soft" className="mt-2">
            Тянет: {stretch.feel}
          </Text>
        )}
        {/* Не подходит — сервер сразу ставит другую на те же мышцы, дальше эта не попадётся */}
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          icon={Ban}
          disabled={flow.excludePending}
          onPress={() => flow.excludeStretch(stretch.id)}
        >
          Не предлагать
        </Button>
      </Rise>
      {stretch.perSide && (
        <Rise>
          <SideTrack side={side} />
        </Rise>
      )}
      {steps.length > 0 && (
        <Rise>
          <StepList items={steps} size="lg" />
        </Rise>
      )}
      {mistakes.length > 0 && (
        <Rise>
          <ScreenSection title="Типичные ошибки">
            <MistakeList items={mistakes} />
          </ScreenSection>
        </Rise>
      )}
      <Rise className="pb-4">
        <VideoLink name={stretch.name} videoUrl={stretch.videoUrl} />
      </Rise>
      <CooldownListSheet flow={flow} />
      <CooldownDetailSheet flow={flow} />
    </Screen>
  );
};
