import { View } from 'react-native';
import { Info, List, SkipBack, SkipForward } from 'lucide-react-native';

import { stretchGuide } from '@sportbot/api/entities/catalog/lib';
import type { ImageCreditResponseDto } from '@sportbot/api/generated/model';
import { toAssetUrl } from '@/shared/api';
import { timerEndSignal } from '@/shared/lib/signal';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { Icon } from '@/shared/ui/kit/Icon';
import { MistakeList, StepList } from '@/shared/ui/kit/StepList';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';
import { HoldControls } from '@/widgets/catalog/HoldControls';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownProgress } from './CooldownProgress';
import { CooldownDetailSheet, CooldownListSheet } from './CooldownSheets';
import { SideTrack } from './SideTrack';

// Подпись под фото: CC BY и CC BY-SA обязывают указать автора, лицензию и источник
const ImageCredit = ({ credit }: { credit: ImageCreditResponseDto | null }) => {
  if (!credit) return null;
  const label = [credit.author, credit.license].filter(Boolean).join(' · ');
  if (!label) return null;
  return (
    <Text size="2xs" tone="muted">
      Фото: {label}
    </Text>
  );
};

// Ссылка на видео техники
const VideoLink = ({ name, videoUrl }: { name: string; videoUrl: string | null }) => {
  if (!videoUrl) return null;
  return (
    <ButtonLink href={videoUrl} variant="outline" size="sm">
      Видео: {name}
    </ButtonLink>
  );
};

type CooldownStepProps = {
  flow: CooldownFlow;
  index: number;
  side: 1 | 2;
};

// Одна растяжка: фото позы, шаги, ошибки и таймер удержания. Следующую человек открывает сам
export const CooldownStep = ({ flow, index, side }: CooldownStepProps) => {
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
      scroll
      header={
        <>
          <TopBar
            back={flow.finish}
            title="Заминка"
            subtitle={`растяжка ${index + 1} из ${all.length} · ~${cooldown.minutes} мин`}
            action={
              <View className="flex-row items-center gap-2">
                <Button variant="outline" size="icon" accessibilityLabel="Карточка растяжки" onPress={() => flow.open(stretch)}>
                  <Icon as={Info} className="size-5" strokeWidth={2.5} />
                </Button>
                <Button variant="outline" size="icon" accessibilityLabel="Весь список" onPress={() => flow.setListOpen(true)}>
                  <Icon as={List} className="size-5" strokeWidth={2.5} />
                </Button>
                <Button variant="destructive" size="sm" onPress={flow.finish}>
                  Завершить
                </Button>
              </View>
            }
          />
          <CooldownProgress ids={all.map((s) => s.id)} current={index} mainCount={cooldown.main.length} />
        </>
      }
      footer={
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
      className="px-gutter pt-4"
    >
      <View className="gap-5">
        <View className="gap-1.5">
          <PhotoPair start={toAssetUrl(stretch.imageUrl) ?? null} end={toAssetUrl(stretch.imageEndUrl) ?? null} alt={stretch.name} />
          <ImageCredit credit={stretch.imageCredit} />
        </View>
        <View>
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
        </View>
        {stretch.perSide && <SideTrack side={side} />}
        {steps.length > 0 && (
          <ScreenSection title="Как делать">
            <StepList items={steps} size="lg" />
          </ScreenSection>
        )}
        {mistakes.length > 0 && (
          <ScreenSection title="Типичные ошибки">
            <MistakeList items={mistakes} />
          </ScreenSection>
        )}
        <VideoLink name={stretch.name} videoUrl={stretch.videoUrl} />
      </View>
      <CooldownListSheet flow={flow} />
      <CooldownDetailSheet flow={flow} />
    </Screen>
  );
};
