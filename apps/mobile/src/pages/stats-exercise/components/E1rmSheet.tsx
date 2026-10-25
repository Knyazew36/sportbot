import { View } from 'react-native';

import type { StatsE1rmResponseDto, StatsE1rmSetResponseDto } from '@sportbot/api/generated/model';

import { formatDate } from '@/shared/lib/format';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { StepChart } from '@/shared/ui/kit/StepChart';
import { Eyebrow, Poster, Text, Unit } from '@/shared/ui/kit/Typography';

import { kg, ROUGH_REPS } from '../model/e1rm';

type E1rmSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  e1rm: StatsE1rmResponseDto;
  periodText: string;
};

const Estimate = ({ label, set }: { label: string; set: StatsE1rmSetResponseDto }) => (
  <View>
    <Eyebrow>{label}</Eyebrow>
    <Poster size="2xl" numeric fit className="mt-1">
      <Poster size="2xl" tone="primary">
        ≈
      </Poster>
      {kg(set.value)}
      <Unit>кг</Unit>
    </Poster>
    <Text size="xs" tone="muted" className="mt-1">
      по подходу {kg(set.weight)} кг × {set.reps}
      {set.reps > ROUGH_REPS && ' — много повторов, оценка грубая'}
    </Text>
  </View>
);

const ACCURACY = [
  'Формула считает, что подход сделан до отказа. Если в запасе оставались повторы, оценка занижена.',
  'Точнее всего — на подходах до 10 повторов. Чем больше повторов, тем больше разброс, а на 15 и больше формула обычно завышает максимум.',
  'Точность зависит от упражнения, опыта и пола: исследования показывают, что у новичков формула обычно немного занижает результат.',
  'Смотри на динамику, а не на одно число: если оценка растёт от тренировки к тренировке, сила растёт.',
  'Это не рабочий вес: проверять максимум на одно повторение — только с разминкой и страховкой.',
];

export const E1rmSheet = ({ open, onOpenChange, e1rm, periodText }: E1rmSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange} title="Расчётный 1ПМ" kicker="оценка, не замер">
    <View className="gap-5 pb-5">
      <View className="gap-4">
        {e1rm.best && <Estimate label={`Лучший ${periodText}`} set={e1rm.best} />}
        {e1rm.current && <Estimate label="Последняя тренировка" set={e1rm.current} />}
      </View>
      {e1rm.points.length > 1 && (
        <StepChart
          data={e1rm.points.map((point) => ({ label: formatDate(point.date, 'd MMM'), value: point.value }))}
          unit="кг"
          curve="line"
          className="-mx-2"
        />
      )}
      <View className="gap-2">
        <Eyebrow>Как считается</Eyebrow>
        <Text size="sm">
          1ПМ — вес, который можно поднять один раз. Здесь он не измерен, а оценён по формуле Эпли: вес × (1 + повторы /
          30). Из подходов тренировки берётся самая высокая оценка.
        </Text>
      </View>
      <View className="gap-2">
        <Eyebrow>Насколько точно</Eyebrow>
        {ACCURACY.map((item) => (
          <View key={item} className="flex-row gap-2">
            <Text size="sm">•</Text>
            <Text size="sm" className="flex-1">
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  </Sheet>
);
