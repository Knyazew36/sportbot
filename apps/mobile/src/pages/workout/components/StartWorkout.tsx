import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

import { useStartWorkout } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { StateView } from '@/shared/ui/kit/StateView';

export const StartWorkout = ({ complexId }: { complexId?: number }) => {
  const start = useStartWorkout();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start.mutate(complexId);
  }, [complexId, start]);

  if (start.isPaused)
    return (
      <Screen
        fullscreen
        header={<TopBar back={() => router.replace(ROUTES.TODAY)} title="Тренировка" />}
        className="px-gutter"
      >
        <StateView
          state="error"
          error={{
            title: 'Нет сети',
            description: 'Начнём тренировку, как только появится связь. Экран можно не закрывать.',
          }}
        />
      </Screen>
    );

  if (start.isError)
    return (
      <Screen fullscreen header={<TopBar back={() => router.replace(ROUTES.TODAY)} title="Тренировка" />} className="px-gutter">
        <StateView
          state="error"
          error={{
            title: 'Не получилось начать',
            description: 'Проверь, что в активной программе есть тренировка с упражнениями.',
            action: (
              <ButtonLink href={ROUTES.TODAY} variant="outline">
                На «Сегодня»
              </ButtonLink>
            ),
          }}
        />
      </Screen>
    );

  return <StateView state="loading" />;
};
