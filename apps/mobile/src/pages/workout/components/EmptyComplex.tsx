import { router } from 'expo-router';

import { ROUTES, routePath } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenState } from '@/shared/ui/kit/ScreenState';

type EmptyComplexProps = {
  programId: number;
  complexId: number;
  title: string;
};

// Нажали «Начать», а в комплексе пусто: тренировку не создаём, зовём наполнить комплекс
export const EmptyComplex = ({ programId, complexId, title }: EmptyComplexProps) => (
  <Screen fullscreen header={<TopBar back={() => router.replace(ROUTES.TODAY)} title={title} />} className="px-gutter">
    <ScreenState
      state="empty"
      title="В тренировке нет упражнений"
      description="Добавь упражнения — и можно начинать."
      action={
        <ButtonLink href={routePath(ROUTES.PROGRAM_ADD_EXERCISE, { programId, complexId })}>
          Добавить упражнения
        </ButtonLink>
      }
    />
  </Screen>
);
