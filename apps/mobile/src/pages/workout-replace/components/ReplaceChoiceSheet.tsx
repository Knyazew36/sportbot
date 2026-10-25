import { View } from 'react-native';

import { Button } from '@/shared/ui/kit/Button';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

import type { ReplaceChoice } from '../model/use-replace-flow';

type ReplaceChoiceSheetProps = {
  choice: ReplaceChoice | null;
  onClose: () => void;
  /** Название упражнения, которое заменяем */
  itemName?: string;
  complexName?: string;
  /** Тренировка из комплекса программы — тогда доступна замена насовсем */
  canReplaceInComplex: boolean;
  pending: boolean;
  onApply: (inComplex: boolean) => void;
};

// Выбор, как заменить: только на эту тренировку или насовсем в комплексе
export const ReplaceChoiceSheet = ({
  choice,
  onClose,
  itemName,
  complexName,
  canReplaceInComplex,
  pending,
  onApply,
}: ReplaceChoiceSheetProps) => (
  <Sheet
    open={choice != null}
    onOpenChange={(open) => !open && onClose()}
    title={`Заменить на «${choice?.name ?? ''}»`}
    description={`Только на эту тренировку или насовсем — в «${complexName ?? ''}» вместо «${itemName ?? ''}».`}
  >
    <View className="gap-3">
      {choice?.draft && (
        <View className="border-primary/60 border-l-2 pl-3">
          <Text size="sm" tone="muted">
            Черновик ушёл администратору на проверку — пока с пометкой «не проверено». Бот напишет исход.
          </Text>
        </View>
      )}
      <Button size="lg" block loading={pending} onPress={() => onApply(false)}>
        Только сегодня
      </Button>
      <Button variant="outline" size="lg" block disabled={pending || !canReplaceInComplex} onPress={() => onApply(true)}>
        Заменить насовсем
      </Button>
    </View>
  </Sheet>
);
