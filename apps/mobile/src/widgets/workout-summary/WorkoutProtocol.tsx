import { Check, Minus } from 'lucide-react-native';

import { doneOrder, lastText, useWorkout } from '@sportbot/api/entities/workout';
import { ExerciseBlocks } from '@/shared/ui/kit/ExerciseBlocks';
import { Icon } from '@/shared/ui/kit/Icon';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Poster, Text } from '@/shared/ui/kit/Typography';

// Протокол: что сделано по каждому упражнению — в итоге тренировки и на её странице из календаря
export const WorkoutProtocol = ({ workoutId }: { workoutId: number }) => {
  const workout = useWorkout(workoutId);
  return (
    <ScreenSection title="Протокол">
      <QueryState query={workout}>
        {(w) => {
          const order = doneOrder(w.exercises);
          return (
            <>
              {order.reordered && (
                <Text size="sm" tone="muted" className="mb-2">
                  По порядку выполнения — он отличался от плана
                </Text>
              )}
              <List>
                <ExerciseBlocks items={order.items}>
                  {(e) => (
                    <ListRow
                      key={e.id}
                      lead={
                        e.done ? (
                          <Icon as={Check} className="size-4" strokeWidth={2.5} />
                        ) : (
                          <Icon as={Minus} className="text-foreground/30 size-4" strokeWidth={2.5} />
                        )
                      }
                      title={e.name}
                    >
                      <Poster size="xs" tone="soft" className="mt-1 tracking-[0.01em]">
                        {lastText({ date: w.date, sets: e.sets }, e.measure) ?? (e.done ? 'без записи подходов' : 'не делал')}
                      </Poster>
                    </ListRow>
                  )}
                </ExerciseBlocks>
              </List>
            </>
          );
        }}
      </QueryState>
    </ScreenSection>
  );
};
