import { View } from 'react-native';
import { ArrowRight, Play, Plus } from 'lucide-react-native';

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { Ring } from '@/shared/ui/kit/Ring';
import { Clock, Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';
import { RestRays } from './RestRays';
import { TimeBumps, useTimeBumps } from './TimeBumps';
import { UnderClock } from './UnderClock';
import { NEXT_LABEL, type NextMode } from './WorkoutActions';

type FocusRestProps = {
  timer: ReturnType<typeof useDeadlineTimer>;
  title: string;
  startedAt: string;
  nextSet: number;
  plannedSets: number;
  /** Отдых между кругами суперсета: табло считает круги */
  round: { letter: string; number: number; rounds: number } | null;
  /** Отдых закончен или пропущен — сразу следующий подход */
  onToSet: () => void;
  /** К экрану упражнения: отдых сворачивается, таймер идёт и виден на кнопке отдыха */
  onClose: () => void;
  /** План по подходам выполнен — главная кнопка ведёт дальше, а не в лишний подход */
  planDone: boolean;
  next: NextMode | null;
  onNext: () => void;
};

// Сверх минуты — целыми минутами: «134 с назад» приходится пересчитывать в уме
const agoLabel = (seconds: number) => (seconds > 59 ? `${Math.floor(seconds / 60)} мин назад` : `${seconds} с назад`);

// Отдых между подходами: обратный отсчёт на весь экран, «+30 с», «К подходу»
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
  const sizes = useFocusSizes();
  const over = timer.left <= 0;
  // Впереди последний подход (или круг) плана — отдых перед ним провожаем лучами
  const lastAhead = !planDone && (round ? round.number === round.rounds : nextSet === plannedSets);
  // total растёт с каждым «+30 с», поэтому прошедшее считаем от него: видно, сколько отдыхали всего, с добавками
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
      // План выполнен — на табло сделанное «3/3», а не несуществующий четвёртый подход
      sets={
        round
          ? { number: round.number, done: round.number - 1, planned: round.rounds, unit: 'круг' }
          : { number: planDone ? nextSet - 1 : nextSet, done: nextSet - 1, planned: plannedSets }
      }
      actions={
        <>
          {planDone ? (
            <Button
              variant={next === 'finish' ? 'success' : 'default'}
              size="xl"
              block
              className="h-24"
              onPress={next ? onNext : onClose}
            >
              {next ? NEXT_LABEL[next] : 'К упражнению'}
              <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
            </Button>
          ) : (
            <Button variant={over ? 'success' : 'default'} size="xl" block className="h-24" onPress={onToSet}>
              <Icon as={Play} className="size-7" />
              {round ? (over ? 'Начать круг' : 'К кругу') : over ? 'Начать подход' : 'К подходу'}
            </Button>
          )}
          <View className="flex-row gap-3">
            {/* Дальше только завершение: продлевать отдых незачем, а вернуться может понадобиться —
                добить подход в другом упражнении */}
            {planDone && next === 'finish' ? (
              <Button variant="outline" className="flex-1" onPress={onClose}>
                К упражнению
              </Button>
            ) : (
              // Отдых окончен — добавить всё равно можно: таймер снова пойдёт от текущего момента
              <Button variant="outline" className="flex-1" onPress={addRest}>
                <Icon as={Plus} strokeWidth={3} />
                30 с
              </Button>
            )}
            {planDone ? (
              <Button variant="outline" className="flex-1" onPress={onToSet}>
                <Icon as={Plus} strokeWidth={3} />
                Ещё подход
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onPress={onClose}>
                К упражнению
              </Button>
            )}
          </View>
        </>
      }
    >
      {/* Заголовок не пропадает по окончании, а высота у него постоянная: «Отдых окончен» длиннее, fit ужимает кегль,
          и без рамки по высоте кольцо съезжало бы вверх */}
      <View className="w-full justify-center" style={{ height: sizes.headline }}>
        <Poster size="4xl" tone={over ? 'muted' : 'primary'} fit className="w-full text-center">
          {over ? 'Отдых окончен' : 'Отдых'}
        </Poster>
      </View>
      <View className="items-center justify-center">
        <Ring value={timer.fraction} sweep={timer.sweep} size={sizes.timerRing} stroke={6} />
        {over && lastAhead && <RestRays size={sizes.timerRing} />}
        <View className="absolute inset-0 items-center justify-center">
          {over ? (
            // Подпись «с назад» висит под словом, не в потоке: иначе её появление сдвигает «Вперёд» вверх
            <View>
              <Poster size="4xl">Вперёд</Poster>
              <UnderClock className="mt-2 gap-1">
                <Eyebrow className="tabular-nums">всего {formatSeconds(rested)}</Eyebrow>
                {-timer.left > 1 && <Eyebrow className="tabular-nums">{agoLabel(-timer.left)}</Eyebrow>}
              </UnderClock>
            </View>
          ) : (
            // Подпись под цифрами тоже вне потока, чтобы цифры стояли ровно по центру кольца
            <View>
              <TimeBumps {...bumps} label="+30 с" />
              <Clock fontSize={sizes.countdown} style={sizes.countdownStyle}>
                {formatSeconds(timer.left)}
              </Clock>
              <UnderClock>
                <Eyebrow className="tabular-nums">
                  {formatSeconds(rested)} из {formatSeconds(timer.total)}
                </Eyebrow>
              </UnderClock>
            </View>
          )}
        </View>
      </View>
    </FocusShell>
  );
};
