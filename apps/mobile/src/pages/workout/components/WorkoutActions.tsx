import { View } from 'react-native';
import { ArrowRight, ClipboardPen, Play, Plus, SkipForward, Timer } from 'lucide-react-native';

import { ROUTES } from '@/shared/config/routes';
import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { StickyFooter } from '@/shared/ui/kit/Screen';
import { Digits, Text } from '@/shared/ui/kit/Typography';

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

  const restBack = resting && (
    <Button variant="rest" size="lg" className="min-w-0 flex-1 shrink" onPress={onRestOpen}>
      <Icon as={Timer} className="size-6" />
      Отдых
      <Digits fontSize={18}>{formatSeconds(restLeft)}</Digits>
    </Button>
  );

  const restButton = restLeft === null && restSeconds !== null && (
    <Button variant="outline" size="lg" onPress={onRest} accessibilityLabel="Начать отдых">
      <Icon as={Timer} className="size-5" />
      <Digits fontSize={18}>{formatSeconds(restSeconds)}</Digits>
    </Button>
  );

  const warmupBack = warmupLeft !== null && (
    <Button variant="rest" size="lg" className="w-full" onPress={onWarmupOpen} accessibilityLabel="Вернуться к разминке">
      <Icon as={Timer} className="size-6" />
      Разминка
      <Digits fontSize={18}>{formatSeconds(warmupLeft)}</Digits>
    </Button>
  );

  const start = superset ? (
    round !== null && (
      <View className="flex-row gap-3">
        {restBack || (
          <Button size="lg" className="min-w-0 flex-1 shrink" onPress={onStartSet}>
            <Icon as={Play} className="size-6" />
            Начать круг {round}
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          onPress={onRecordRound}
          accessibilityLabel="Записать круг без секундомера"
        >
          <Icon as={ClipboardPen} className="size-5" />
        </Button>
        {restButton}
      </View>
    )
  ) : (
    <View className="flex-row gap-3">
      {restBack || (
        <Button variant={planDone ? 'outline' : 'default'} size="lg" className="flex-1" onPress={onStartSet}>
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
      className="w-full justify-between"
      onPress={onNext}
      disabled={nextPending}
    >
      <><Text >{NEXT_LABEL[next]}</Text></>
      {next === 'skip' ? (
        <Icon as={SkipForward} className="size-6" />
      ) : (
        <Icon as={ArrowRight} className="size-6" strokeWidth={2.5} />
      )}
    </Button>
  );

  const more = next === 'finish' && (
    <ButtonLink href={ROUTES.WORKOUT_ADD} variant="outline" size="lg" className="w-full">
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
