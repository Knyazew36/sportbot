import { View } from 'react-native';
import { ArrowRight, Play, Plus } from 'lucide-react-native';

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { Ring } from '@/shared/ui/kit/Ring';
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';

import { FocusShell } from './FocusShell';
import { TimeBumps, useTimeBumps } from './TimeBumps';
import { NEXT_LABEL, type NextMode } from './WorkoutActions';

type FocusRestProps = {
  timer: ReturnType<typeof useDeadlineTimer>;
  title: string;
  startedAt: string;
  nextSet: number;
  plannedSets: number;
  round: { letter: string; number: number; rounds: number } | null;
  onToSet: () => void;
  onClose: () => void;
  planDone: boolean;
  next: NextMode | null;
  onNext: () => void;
};

const agoLabel = (seconds: number) => (seconds > 59 ? `${Math.floor(seconds / 60)} мин назад` : `${seconds} с назад`);

export const FocusRest = ({
  timer,
  title,
  startedAt,
  nextSet,
  plannedSets,
  round,
  onToSet,
  onClose,
  planDone,
  next,
  onNext,
}: FocusRestProps) => {
  const over = timer.left <= 0;
  const lastAhead = !planDone && (round ? round.number === round.rounds : nextSet === plannedSets);
  const rested = Math.max(0, timer.total - timer.left);
  const bumps = useTimeBumps();
  const addRest = () => {
    timer.add(30);
    bumps.bump();
  };

  return (
    <FocusShell
      title={title}
      startedAt={startedAt}
      status={
        planDone
          ? 'отдых · план выполнен'
          : round
            ? `суперсет ${round.letter} · дальше круг ${round.number} из ${round.rounds}`
            : undefined
      }
      sets={
        round
          ? { number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }
          : { number: planDone ? nextSet - 1 : nextSet, done: nextSet - 1, planned: plannedSets }
      }
      actions={
        <>
          {planDone ? (
            <Button variant={next === 'finish' ? 'success' : 'default'} size="xl" block className="h-24" onPress={next ? onNext : onClose}>
              <>{next ? NEXT_LABEL[next] : 'К упражнению'}</>
              <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
            </Button>
          ) : (
            <Button variant={over ? 'success' : 'default'} size="xl" block className="h-24" onPress={onToSet}>
              <Icon as={Play} className="size-7" />
              {round ? (over ? 'Начать круг' : 'К кругу') : over ? 'Начать подход' : 'К подходу'}
            </Button>
          )}
          <View className="flex-row gap-3">
            {planDone && next === 'finish' ? (
              <Button variant="outline" block onPress={onClose}>
                К упражнению
              </Button>
            ) : (
              <Button variant="outline" block onPress={addRest}>
                <Icon as={Plus} strokeWidth={3} />
                30 с
              </Button>
            )}
            {planDone ? (
              <Button variant="outline" block onPress={onToSet}>
                <Icon as={Plus} strokeWidth={3} />
                Ещё подход
              </Button>
            ) : (
              <Button variant="outline" block onPress={onClose}>
                К упражнению
              </Button>
            )}
          </View>
        </>
      }
    >
      <View className="flex h-[72px] w-full items-center">
        <Poster size="4xl" tone={over ? 'muted' : 'primary'} fit className="w-full text-center">
          {over ? 'Отдых окончен' : 'Отдых'}
        </Poster>
      </View>
      <View className="relative flex items-center justify-center">
        <Ring value={timer.fraction} size={300} stroke={6} className="h-auto w-[min(300px,80vw,36svh)]" />
        {over && lastAhead && <View className="bg-rest absolute inset-0 rounded-full opacity-20" />}
        <View className="absolute inset-0 flex flex-col items-center justify-center">
          {over ? (
            <View className="relative">
              <Poster size="4xl">Вперёд</Poster>
              <Eyebrow className="absolute top-full left-1/2 mt-2 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
                <Digits fontSize={11}>{`всего ${formatSeconds(rested)}`}</Digits>
                {-timer.left > 1 && <Digits fontSize={11}>{agoLabel(-timer.left)}</Digits>}
              </Eyebrow>
            </View>
          ) : (
            <View className="relative">
              <TimeBumps {...bumps} label="+30 с" />
              <Poster size="hero" numeric className="text-[min(96px,22vw,12svh)]">
                <Digits fontSize={96}>{formatSeconds(timer.left)}</Digits>
              </Poster>
              <Eyebrow className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Digits fontSize={11}>{`${formatSeconds(rested)} из ${formatSeconds(timer.total)}`}</Digits>
              </Eyebrow>
            </View>
          )}
        </View>
      </View>
    </FocusShell>
  );
};
