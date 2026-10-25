import { View } from 'react-native';
import { ArrowRight, Plus } from 'lucide-react-native';

import { formatSeconds, type useDeadlineTimer } from '@/shared/lib/hooks/use-deadline-timer';
import { Ring } from '@/shared/ui/kit/Ring';
import { Digits, Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';

import { FocusShell } from './FocusShell';
import { TimeBumps, useTimeBumps } from './TimeBumps';

type FocusWarmupProps = {
  timer: ReturnType<typeof useDeadlineTimer>;
  first: { name: string };
  onClose: () => void;
};

export const FocusWarmup = ({ timer, first, onClose }: FocusWarmupProps) => {
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
          <Button variant="outline" disabled={over} onPress={addMinute}>
            <Icon as={Plus} strokeWidth={3} />1 мин
          </Button>
        </>
      }
    >
      <View className="flex h-[72px] w-full items-center">
        <Poster size="4xl" tone={over ? 'muted' : 'primary'} fit className="w-full text-center">
          Разминка
        </Poster>
      </View>
      <View className="relative flex items-center justify-center">
        <Ring value={timer.fraction} size={300} stroke={6} className="h-auto w-[min(300px,80vw,36svh)]" />
        <View className="absolute inset-0 flex flex-col items-center justify-center">
          {over ? (
            <Poster size="4xl">Вперёд</Poster>
          ) : (
            <View className="relative">
              <TimeBumps {...bumps} label="+1 мин" />
              <Poster size="hero" numeric className="text-[min(96px,22vw,12svh)]">
                <Digits fontSize={96}>{formatSeconds(timer.left)}</Digits>
              </Poster>
              <Eyebrow className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Digits fontSize={11}>{`из ${formatSeconds(timer.total)}`}</Digits>
              </Eyebrow>
            </View>
          )}
        </View>
      </View>
    </FocusShell>
  );
};
