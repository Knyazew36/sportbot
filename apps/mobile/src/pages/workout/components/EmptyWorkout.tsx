import { router } from 'expo-router';

import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenState } from '@/shared/ui/kit/ScreenState';

type EmptyWorkoutProps = {
  title: string;
  online: boolean;
  onDiscard: () => void;
};

// В тренировке не осталось упражнений: остаётся только отменить её
export const EmptyWorkout = ({ title, online, onDiscard }: EmptyWorkoutProps) => (
  <Screen fullscreen header={<TopBar back={() => router.replace(ROUTES.TODAY)} title={title} />} className="px-gutter">
    <ScreenState
      state="empty"
      title="В тренировке нет упражнений"
      description="Добавь упражнения в программе или отмени тренировку."
      action={
        // Отмена удаляет тренировку на сервере — без сети её не сделать
        <Button variant="outline" disabled={!online} onPress={onDiscard}>
          {online ? 'Отменить тренировку' : 'Отменить · нужна сеть'}
        </Button>
      }
    />
  </Screen>
);
