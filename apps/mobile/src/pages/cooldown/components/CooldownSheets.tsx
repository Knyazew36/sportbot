import { Ban } from 'lucide-react-native';

import { Button } from '@/shared/ui/kit/Button';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { VideoLink } from '@/widgets/catalog/VideoLink';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownAdd } from './CooldownAdd';
import { StretchListSheet } from './StretchListSheet';

/** Весь список растяжек: переход к любой, карточка, добавление и выход */
export const CooldownListSheet = ({ flow }: { flow: CooldownFlow }) => (
  <StretchListSheet
    open={flow.listOpen}
    onOpenChange={flow.setListOpen}
    main={flow.cooldown.main}
    optional={flow.cooldown.optional}
    minutes={flow.remainingMinutes}
    current={flow.phase.kind === 'step' ? flow.phase.index : null}
    done={flow.done}
    onPick={flow.go}
    onOpen={flow.open}
    onAdd={() => {
      flow.setListOpen(false);
      flow.setAddOpen(true);
    }}
    onFinish={flow.finish}
  />
);

/** Добавить растяжку с экрана, где нет своего места под выбор */
export const CooldownAddSheet = ({ flow }: { flow: CooldownFlow }) => (
  <Sheet open={flow.addOpen} onOpenChange={flow.setAddOpen} title="Добавить растяжку">
    <CooldownAdd flow={flow} />
  </Sheet>
);

// Карточка растяжки. Без «Подробнее в справочнике»: уход со страницы сбросил бы, на какой растяжке человек.
// «Не предлагать» навсегда — здесь, а не на экране заминки: на один раз там есть «Другая»
export const CooldownDetailSheet = ({ flow }: { flow: CooldownFlow }) => {
  const { opened } = flow;
  const stretch = opened && flow.all.find((s) => s.id === opened.id);
  return (
    <ExerciseSheet
      exercise={opened}
      kind="stretch"
      onOpenChange={(open) => !open && flow.closeOpened()}
      action={
        stretch && (
          <>
            <VideoLink name={stretch.name} videoUrl={stretch.videoUrl} />
            <Button
              variant="outline"
              size="lg"
              block
              icon={Ban}
              disabled={flow.excludePending}
              onPress={() => flow.excludeStretch(stretch.id)}
            >
              Не предлагать
            </Button>
          </>
        )
      }
    />
  );
};
