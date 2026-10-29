import { View } from 'react-native';
import { ArrowRight, Plus } from 'lucide-react-native';

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Ring } from '@/shared/ui/kit/Ring';
import { Clock, Eyebrow, Poster } from '@/shared/ui/kit/Typography';

import { useFocusSizes } from '../model/use-focus-sizes';
import { FocusShell } from './FocusShell';
import { UnderClock } from './UnderClock';

type WarmupStartProps = {
  /** Минуты разминки — по комплексу и профилю, как resolveWarmup при создании тренировки */
  minutes: number;
  /** Первое упражнение комплекса — его название в статусе, как на настоящем экране */
  first: string;
};

// Заставка на время создания тренировки в базе телефона вместо лоадера: выглядит как FocusWarmup,
// но без таймера — отсчёт подхватит настоящий экран разминки. Кнопки те же, только неактивные:
// без них при подмене экрана кнопки «выскакивали» и кольцо сдвигалось
export const WarmupStart = ({ minutes, first }: WarmupStartProps) => {
  const sizes = useFocusSizes();
  const total = minutes * 60;

  return (
    <FocusShell
      status={`дальше · ${first}`}
      actions={
        <View pointerEvents="none" className="gap-3">
          <Button size="xl" block className="h-24">
            К упражнениям
            <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
          </Button>
          <Button variant="outline" block>
            <Icon as={Plus} strokeWidth={3} />1 мин
          </Button>
        </View>
      }
    >
      <View className="w-full justify-center" style={{ height: sizes.headline }}>
        <Poster size="4xl" tone="primary" fit className="w-full text-center">
          Разминка
        </Poster>
      </View>
      <View className="items-center justify-center">
        <Ring value={1} size={sizes.timerRing} stroke={6} />
        <View className="absolute inset-0 items-center justify-center">
          <View>
            <Clock fontSize={sizes.countdown} style={sizes.countdownStyle}>
              {formatSeconds(total)}
            </Clock>
            <UnderClock>
              <Eyebrow className="tabular-nums">из {formatSeconds(total)}</Eyebrow>
            </UnderClock>
          </View>
        </View>
      </View>
    </FocusShell>
  );
};
