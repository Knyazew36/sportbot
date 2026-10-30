import { useState } from 'react';
import { router } from 'expo-router';
import { Info, SkipBack, SkipForward } from 'lucide-react-native';

import type { StretchRoutine } from '@sportbot/api/entities/stretch-routine';
import { timerEndSignal } from '@/shared/lib/signal';
import { useProfile } from '@/shared/local/entities/profile';
import { Button } from '@/shared/ui/kit/Button';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { HoldControls } from '@/widgets/catalog/HoldControls';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';
import { StretchProgress } from '@/widgets/stretch-run/StretchProgress';
import { StretchStepBody } from '@/widgets/stretch-run/StretchStepBody';

import { useStretchRoutineRunFlow } from '../model/use-stretch-routine-run-flow';

export const RunStep = ({ routine }: { routine: StretchRoutine }) => {
  const flow = useStretchRoutineRunFlow(routine);
  const { stretch, index, side } = flow;
  const { data: profile } = useProfile();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const ids = routine.stretches.map((s) => s.id);
  const key = `${index}-${stretch.id}-${side}`;

  return (
    <Screen
      key={`screen-${key}`}
      fullscreen
      header={
        <>
          <TopBar back={() => router.back()} title={routine.name} subtitle={`${index + 1} из ${ids.length}`} />
          <StretchProgress ids={ids} current={index} done={new Set(ids.slice(0, index))} mainCount={ids.length} />
        </>
      }
      footer={
        <HoldControls
          key={`hold-${key}`}
          holdSeconds={stretch.holdSeconds}
          autoStart={side === 2}
          back={{ label: 'Назад', icon: SkipBack, onPress: flow.prev, disabled: index === 0 && side === 1 }}
          next={{
            label: stretch.perSide && side === 1 ? 'Левая' : flow.isLast ? 'Готово' : 'Дальше',
            icon: SkipForward,
            onPress: flow.next,
          }}
          onEnd={() => profile && timerEndSignal(profile)}
        />
      }
      className="gap-5 px-gutter pt-4"
    >
      <StretchStepBody
        stretch={stretch}
        side={side}
        eyebrow={stretch.muscles}
        actions={
          <Button variant="outline" size="sm" icon={Info} onPress={() => setDetailsOpen(true)}>
            Подробнее
          </Button>
        }
      />
      <ExerciseSheet exercise={detailsOpen ? stretch : null} kind="stretch" onOpenChange={setDetailsOpen} />
    </Screen>
  );
};
