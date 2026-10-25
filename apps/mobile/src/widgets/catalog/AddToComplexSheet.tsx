import { useState } from 'react';
import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';
import { Check } from 'lucide-react-native';

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { Sheet } from '@/shared/ui/kit/Sheet';

type ComplexOption = { id: number; letter: string; title: string; count: number };

type AddToComplexSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: string;
  program: string;
  complexes: ComplexOption[];
  /** Комплекс выбран: сообщение «Добавлено» — когда промис выполнится */
  onPick: (complexId: number) => Promise<unknown> | void;
};

// «Добавить в комплекс» из карточки упражнения: выбор комплекса активной программы (frontend-tz, 11.2) —
// порт widgets/catalog/AddToComplexSheet.tsx
export const AddToComplexSheet = ({ open, onOpenChange, exercise, program, complexes, onPick }: AddToComplexSheetProps) => {
  const [added, setAdded] = useState<number | null>(null);
  const target = complexes.find((c) => c.id === added);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) setAdded(null);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={close}
      title={target ? 'Добавлено' : 'В какую тренировку?'}
      description={
        target
          ? `«${exercise}» — в конце тренировки «${target.title}». Подходы можно поправить в редакторе программы.`
          : program
      }
    >
      <View className="gap-2">
        {target ? (
          <Button variant="outline" block icon={Check} onPress={() => close(false)}>
            Готово
          </Button>
        ) : (
          complexes.map((c) => (
            <OptionButton
              key={c.id}
              mark={c.letter}
              title={c.title}
              meta={pluralize(c.count, EXERCISE_FORMS)}
              onPress={() =>
                Promise.resolve(onPick(c.id))
                  .then(() => setAdded(c.id))
                  // Ошибку уже показал общий тост — шторка остаётся на выборе
                  .catch(() => undefined)
              }
            />
          ))
        )}
      </View>
    </Sheet>
  );
};
