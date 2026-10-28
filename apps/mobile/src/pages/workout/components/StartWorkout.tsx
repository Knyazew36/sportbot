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
import { WarmupStart } from './WarmupStart';

const header = <TopBar back={() => router.replace(ROUTES.TODAY)} title="Тренировка" />;

/** Начать тренировку, если её ещё нет: «Начать» с «Сегодня» ведёт сюда с complexId */
export const StartWorkout = ({ complexId }: { complexId?: number }) => {
  const { start, empty, warmup } = useStartWorkout(complexId);

  if (empty) return <EmptyComplex {...empty} />;

  // Тренировка создаётся на телефоне сразу, сеть не нужна: отказ здесь — по делу (нет программы, пустой комплекс)
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

  // Вместо лоадера сразу экран разминки: состав известен по комплексу, тренировка допишется под ним
  if (warmup) return <WarmupStart {...warmup} />;

  return <PageLoader />;
};
