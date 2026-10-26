import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { Sheet } from '@/shared/ui/kit/Sheet';

type ComplexOption = { id: number; letter: string; title: string; count: number };

type AddToComplexSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: string;
  complexes: ComplexOption[];
  /** Комплекс выбран: шторка закроется, когда промис выполнится */
  onPick: (complexId: number) => Promise<unknown> | void;
};

// «Добавить в комплекс» из карточки упражнения: выбор комплекса активной программы (frontend-tz, 11.2) —
// порт widgets/catalog/AddToComplexSheet.tsx. Об успехе говорит общий тост мутации, экрана «Добавлено» нет
export const AddToComplexSheet = ({ open, onOpenChange, program, complexes, onPick }: AddToComplexSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange} title="В какую тренировку?" description={program}>
    <View className="gap-2">
      {complexes.map((c) => (
        <OptionButton
          key={c.id}
          mark={c.letter}
          title={c.title}
          meta={pluralize(c.count, EXERCISE_FORMS)}
          onPress={() =>
            Promise.resolve(onPick(c.id))
              .then(() => onOpenChange(false))
              // Ошибку уже показал общий тост — шторка остаётся на выборе
              .catch(() => undefined)
          }
        />
      ))}
    </View>
  </Sheet>
);
