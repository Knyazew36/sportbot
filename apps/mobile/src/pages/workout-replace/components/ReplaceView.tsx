import { Plus, Repeat } from 'lucide-react-native';

import { useAnalogs, type Workout } from '@sportbot/api/entities/workout';
import { Button } from '@/shared/ui/kit/Button';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Lead, Text } from '@/shared/ui/kit/Typography';
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

import { useReplaceFlow } from '../model/use-replace-flow';
import { AnalogList } from './AnalogList';
import { ReplaceChoiceSheet } from './ReplaceChoiceSheet';

type ReplaceViewProps = { itemId: number; workout: Workout | null };

// Замена упражнения (business-tz, 7.4): аналоги с теми же основными мышцами, без зон с ограничением,
// затем «только сегодня» или «в комплексе». История весов у аналога своя
export const ReplaceView = ({ itemId, workout }: ReplaceViewProps) => {
  const analogs = useAnalogs(itemId);
  const flow = useReplaceFlow(itemId);
  const item = workout?.exercises.find((e) => e.id === itemId);
  const openCreate = () => flow.setCreateOpen(true);

  return (
    <Screen fullscreen header={<TopBar title="Замена" subtitle={item?.name} />} className="px-gutter">
      <Rise className="gap-2">
        <Lead>те же мышцы{item?.limitedZones.length ? ', без зон с ограничением' : ''} —</Lead>
        <Text tone="soft">Подходы этого упражнения на сегодня удалятся: у аналога своя история весов.</Text>
      </Rise>

      <ScreenSection title="Аналоги" aside={analogs.data ? `${analogs.data.length}` : undefined}>
        <QueryState
          query={analogs}
          isEmpty={(list) => list.length === 0}
          empty={{
            title: 'Подходящих аналогов нет',
            description: 'Все упражнения на эти мышцы уже в тренировке или нагружают сустав с ограничением.',
            action: (
              <Button variant="outline" icon={Plus} onPress={openCreate}>
                Создать своё упражнение
              </Button>
            ),
          }}
        >
          {(list) => <AnalogList list={list} onPreview={flow.setPreview} onChoose={flow.setChoice} />}
        </QueryState>
        {!!analogs.data?.length && (
          <Button variant="outline" block icon={Plus} onPress={openCreate}>
            Нет нужного — создать своё
          </Button>
        )}
      </ScreenSection>

      <ExerciseSheet
        exercise={flow.preview}
        onOpenChange={(open) => !open && flow.setPreview(null)}
        action={
          <Button size="lg" block icon={Repeat} onPress={flow.chooseFromPreview}>
            Заменить на это
          </Button>
        }
      />

      <ReplaceChoiceSheet
        choice={flow.choice}
        onClose={() => flow.setChoice(null)}
        itemName={item?.name}
        complexName={workout?.complexName ?? undefined}
        canReplaceInComplex={!!workout?.complexId}
        pending={flow.pending}
        onApply={flow.apply}
      />

      <ExerciseCreateSheet open={flow.createOpen} onOpenChange={flow.setCreateOpen} onCreated={flow.setChoice} />
    </Screen>
  );
};
