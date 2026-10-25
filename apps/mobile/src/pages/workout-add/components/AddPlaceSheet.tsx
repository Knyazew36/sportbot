import { View } from 'react-native';

import { Button } from '@/shared/ui/kit/Button';
import { Sheet } from '@/shared/ui/kit/Sheet';

type AddPlaceSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Комплекс программы, из которого тренировка; null — тренировка вне программы */
  complexName: string | null;
  pending: boolean;
  onApply: (inComplex: boolean) => void;
};

// «Куда добавить»: только в эту тренировку или ещё и в конец комплекса — тогда будет и в следующий раз
export const AddPlaceSheet = ({ open, onClose, complexName, pending, onApply }: AddPlaceSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={(next) => !next && onClose()}
    title="Куда добавить"
    description={
      complexName
        ? `Только в эту тренировку или ещё и в конец «${complexName}» — тогда будет и в следующий раз.`
        : 'Встанет в конец сегодняшней тренировки.'
    }
  >
    <View className="gap-3">
      <Button size="lg" block loading={pending} onPress={() => onApply(false)}>
        Только сегодня
      </Button>
      {complexName ? (
        <Button variant="outline" size="lg" block disabled={pending} onPress={() => onApply(true)}>
          И в комплекс
        </Button>
      ) : null}
    </View>
  </Sheet>
);
