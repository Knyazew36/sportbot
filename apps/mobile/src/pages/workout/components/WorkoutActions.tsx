import { View } from 'react-native';
import { ArrowRight, ClipboardPen, Flame, Play, Plus, SkipForward, Timer } from 'lucide-react-native';

import { ROUTES } from '@/shared/config/routes';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { StickyFooter } from '@/shared/ui/kit/Screen';
import { Clock } from '@/shared/ui/kit/Typography';

import { BUTTON_LG_FONT } from './workout-actions.const';

export type NextMode = 'skip' | 'next' | 'finish';

type WorkoutActionsProps = {
  planDone: boolean;
  next: NextMode | null;
  nextPending: boolean;
  restSeconds: number | null;
  restLeft?: number | null;
  onRestOpen?: () => void;
  warmupLeft?: number | null;
  onWarmupOpen?: () => void;
  round?: number | null;
  onRecordRound?: () => void;
  onStartSet: () => void;
  onRest: () => void;
  onNext: () => void;
};

export const NEXT_LABEL: Record<NextMode, string> = {
  skip: 'Следующее упражнение',
  next: 'Следующее упражнение',
  finish: 'Завершить тренировку',
};

export const WorkoutActions = ({
  planDone,
  next,
  nextPending,
  restSeconds,
  restLeft = null,
  round,
  onRecordRound,
  onStartSet,
  onRest,
  onRestOpen,
  warmupLeft = null,
  onWarmupOpen,
  onNext,
}: WorkoutActionsProps) => {
  const superset = round !== undefined;
  const resting = restLeft !== null && restLeft > 0;

  // Свёрнутый отдых ещё идёт — вместо подхода кнопка отдыха с остатком, тап разворачивает его.
  // Время — Clock с цифровыми ячейками: строкой оно прыгало бы по ширине каждую секунду («1» уже «0»)
  const restBack = resting && (
    <Button variant="rest" size="lg" block onPress={onRestOpen}>
      <Icon as={Timer} className="size-6" />
      Отдых
      <Clock fontSize={BUTTON_LG_FONT}>{formatSeconds(restLeft)}</Clock>
    </Button>
  );

  const restButton = restLeft === null && restSeconds !== null && (
    <Button variant="outline" size="lg" block onPress={onRest} accessibilityLabel="Начать отдых">
      <Icon as={Timer} className="size-6" />
      Отдых {formatSeconds(restSeconds)}
    </Button>
  );

  const warmupBack = warmupLeft !== null && (
    <Button variant="warmup" size="lg" block onPress={onWarmupOpen} accessibilityLabel="Вернуться к разминке">
      <Icon as={Flame} className="size-6" />
      Разминка
      <Clock fontSize={BUTTON_LG_FONT}>{formatSeconds(warmupLeft)}</Clock>
    </Button>
  );

  const start = superset ? (
    round !== null && (
      <View className="flex-col gap-3">
        {restBack || (
          <Button size="lg" block onPress={onStartSet}>
            <Icon as={Play} className="size-6" />
            Начать круг {round}
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          block
          onPress={onRecordRound}
          accessibilityLabel="Записать круг без секундомера"
        >
          <Icon as={ClipboardPen} className="size-5" />
          Записать круг
        </Button>
        {restButton}
      </View>
    )
  ) : (
    <View className="flex-col gap-3">
      {restBack || (
        <Button variant={planDone ? 'outline' : 'default'} size="lg" block onPress={onStartSet}>
          {planDone ? <Icon as={Plus} strokeWidth={3} /> : <Icon as={Play} className="size-6" />}
          {planDone ? 'Ещё подход' : 'Начать подход'}
        </Button>
      )}
      {restButton}
    </View>
  );

  const forward = next && (
    <Button
      variant={next === 'finish' ? 'success' : next === 'next' && planDone ? 'ink' : 'outline'}
      size="lg"
      block
      // Капсом «Следующее упражнение» шире узкого экрана — подпись переносится на вторую строку, а не режется
      spread
      onPress={onNext}
      disabled={nextPending}
    >
      {NEXT_LABEL[next]}
      {next === 'skip' ? (
        <Icon as={SkipForward} className="size-6" />
      ) : (
        <Icon as={ArrowRight} className="size-6" strokeWidth={2.5} />
      )}
    </Button>
  );

  const more = next === 'finish' && (
    <ButtonLink href={ROUTES.WORKOUT_ADD} variant="outline" size="lg" block>
      <Icon as={Plus} strokeWidth={3} />
      Ещё упражнение
    </ButtonLink>
  );

  return (
    <StickyFooter className="flex-col items-stretch gap-3">
      {planDone ? forward : start}
      {!planDone && warmupBack}
      {planDone ? start : forward}
      {planDone && warmupBack}
      {more}
    </StickyFooter>
  );
};
