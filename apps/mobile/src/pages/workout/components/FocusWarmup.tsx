import { View } from 'react-native';
import { ArrowRight, Plus } from 'lucide-react-native';

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { Ring } from '@/shared/ui/kit/Ring';
import { Clock, Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';
import { TimeBumps, useTimeBumps } from './TimeBumps';
import { UnderClock } from './UnderClock';

type FocusWarmupProps = {
  timer: ReturnType<typeof useDeadlineTimer>;
  /** Первое упражнение тренировки — его название в статусе */
  first: { name: string };
  /** К экрану упражнения: разминка сворачивается, отсчёт идёт и виден на кнопке в футере */
  onClose: () => void;
};

// Разминка перед первым упражнением: обратный отсчёт на весь экран, как отдых. Сама не закрывается —
// по окончании ждёт «К упражнениям». Подход отсюда не начинается: сначала экран упражнения
export const FocusWarmup = ({ timer, first, onClose }: FocusWarmupProps) => {
  const sizes = useFocusSizes();
  const over = timer.status === 'running' && timer.left <= 0;
  const bumps = useTimeBumps();
  const addMinute = () => {
    timer.add(60);
    bumps.bump();
  };

  return (
    <FocusShell
      status={over ? 'разминка закончилась' : `дальше · ${first.name}`}
      alert={over}
      actions={
        <>
          <Button variant={over ? 'success' : 'default'} size="xl" block className="h-24" onPress={onClose}>
            К упражнениям
            <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
          </Button>
          <Button variant="outline" block disabled={over} onPress={addMinute}>
            <Icon as={Plus} strokeWidth={3} />1 мин
          </Button>
        </>
      }
    >
      {/* Заголовок по центру над кольцом, как «Отдых»: высота постоянная, кольцо не прыгает */}
      <View className="w-full justify-center" style={{ height: sizes.headline }}>
        <Poster size="4xl" tone={over ? 'muted' : 'primary'} fit className="w-full text-center">
          Разминка
        </Poster>
      </View>
      <View className="items-center justify-center">
        <Ring value={timer.fraction} sweep={timer.sweep} size={sizes.timerRing} stroke={6} />
        <View className="absolute inset-0 items-center justify-center">
          {over ? (
            <Poster size="4xl">Вперёд</Poster>
          ) : (
            // Подпись под цифрами вне потока, чтобы цифры стояли ровно по центру кольца
            <View>
              <TimeBumps {...bumps} label="+1 мин" />
              <Clock fontSize={sizes.countdown} style={sizes.countdownStyle}>
                {formatSeconds(timer.left)}
              </Clock>
              <UnderClock>
                <Eyebrow className="tabular-nums">из {formatSeconds(timer.total)}</Eyebrow>
              </UnderClock>
            </View>
          )}
        </View>
      </View>
    </FocusShell>
  );
};
