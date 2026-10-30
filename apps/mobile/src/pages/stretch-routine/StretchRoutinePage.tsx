import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { useStretchRoutine } from '@/shared/local/entities/stretch-routine';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { QueryScreen } from '@/shared/ui/kit/QueryScreen';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { RoutineStretches } from './components/RoutineStretches';

// Карточка комплекса: состав и старт занятия
const StretchRoutinePage = () => {
  const routineId = Number(useLocalSearchParams<{ routineId: string }>().routineId);
  const routine = useStretchRoutine(routineId);
  return (
    <QueryScreen query={routine} fullscreen>
      {(data) => (
        <Screen
          fullscreen
          header={<TopBar back={() => router.back()} title={data.name} />}
          footer={
            <StickyFooter>
              <Button size="lg" onPress={() => router.push(routeHref(ROUTES.STRETCH_ROUTINE_RUN, { routineId }))}>
                Начать
                <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
              </Button>
            </StickyFooter>
          }
          className="px-gutter"
        >
          <Rise>
            <Lead>{data.description}</Lead>
            <Poster size="display" tone="primary">
              {`~${data.minutes} мин`}
            </Poster>
          </Rise>
          <RoutineStretches stretches={data.stretches} />
        </Screen>
      )}
    </QueryScreen>
  );
};

export default StretchRoutinePage;
