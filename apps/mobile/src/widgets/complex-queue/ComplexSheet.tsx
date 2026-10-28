import type { ReactNode } from 'react';
import { CalendarCheck } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { useProfile } from '@/shared/local/entities/profile';
import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program';

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';
import { ComplexPlanList } from '@/widgets/program-preview/ComplexPlanList';

type ComplexSheetProps = {
  /** Открытый комплекс и его место в очереди; null — шторка закрыта */
  complex: { complex: ProgramComplex; index: number } | null;
  onClose: () => void;
  /** Подсвеченный комплекс: для него кнопка выбора не нужна */
  activeId?: number;
  /** Выбор комплекса; без него шторка только показывает состав */
  onPick?: (id: number) => void;
  /** Подпись кнопки выбора: на «Сегодня» — на сегодня, в программах — следующий в очереди */
  pickLabel?: string;
  /** Своё действие под составом, например «Скопировать к себе»; close закрывает шторку */
  action?: (complex: ProgramComplex, close: () => void) => ReactNode;
};

// Состав комплекса из очереди — порт widgets/complex-queue/ComplexSheet.tsx: упражнения и подходы
// без перехода в редактор
export const ComplexSheet = ({
  complex,
  onClose,
  activeId,
  onPick,
  pickLabel = 'Буду делать сегодня',
  action,
}: ComplexSheetProps) => {
  const c = complex?.complex;
  // У комплекса без своей разминки — разминка из профиля, как на старте тренировки
  const profile = useProfile();
  const warmup = c ? (c.warmupMinutes ?? profile.data?.warmupMinutes) || null : null;

  const footer =
    c && action
      ? action(c, onClose)
      : c && onPick && c.id !== activeId && (
          <Button
            size="lg"
            block
            icon={CalendarCheck}
            onPress={() => {
              onPick(c.id);
              onClose();
            }}
          >
            {pickLabel}
          </Button>
        );

  return (
    <Sheet
      open={complex !== null}
      onOpenChange={(open) => !open && onClose()}
      kicker={complex && `Тренировка ${complexLetter(complex.index)}`}
      title={c?.name}
      description={c && `${pluralize(c.exercises.length, EXERCISE_FORMS)}${c.isNext ? ' · на очереди' : ''}`}
      footer={footer || undefined}
    >
      {c &&
        (c.exercises.length === 0 && !c.cardioName ? (
          <Text tone="soft">В тренировке пока нет упражнений — добавь их в редакторе программы.</Text>
        ) : (
          <ComplexPlanList complex={c} warmupMinutes={warmup} numbered />
        ))}
    </Sheet>
  );
};
