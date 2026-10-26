import { errorCatch } from '@front-cmdt/utils/error-catch';
import { router } from 'expo-router';

import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { PageLoader } from '@/shared/ui/kit/PageLoader';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenState } from '@/shared/ui/kit/ScreenState';

import { useStartWorkout } from '../model/use-start-workout';
import { EmptyComplex } from './EmptyComplex';

const header = <TopBar back={() => router.replace(ROUTES.TODAY)} title="Тренировка" />;

/** Начать тренировку, если её ещё нет: «Начать» с «Сегодня» ведёт сюда с complexId */
export const StartWorkout = ({ complexId }: { complexId?: number }) => {
  const { start, empty } = useStartWorkout(complexId);

  if (empty) return <EmptyComplex {...empty} />;

  // Старт создаёт тренировку на сервере: без сети мутация стоит на паузе и сама уйдёт, когда сеть появится
  if (start.isPaused)
    return (
      <Screen fullscreen header={header} className="px-gutter">
        <ScreenState
          state="error"
          title="Нет сети"
          description="Начнём тренировку, как только появится связь. Экран можно не закрывать."
        />
      </Screen>
    );

  // Сбой сети ставит старт на паузу (выше), так что здесь отказ сервера по делу — не «нет связи»
  if (start.isError)
    return (
      <Screen fullscreen header={header} className="px-gutter">
        <ScreenState
          state="empty"
          title="Не получилось начать"
          description={String(errorCatch(start.error) || 'Проверь, что в активной программе есть тренировка с упражнениями.')}
          action={
            <ButtonLink href={ROUTES.TODAY} replace variant="outline">
              На «Сегодня»
            </ButtonLink>
          }
        />
      </Screen>
    );

  return <PageLoader />;
};
