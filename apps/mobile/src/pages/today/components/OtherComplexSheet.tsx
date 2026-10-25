import { View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { DayToday } from '@sportbot/api/entities/day';
import { complexLetter } from '@sportbot/api/entities/program';

import { ROUTES } from '@/shared/config/routes';
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

type OtherComplexSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programName: string | null;
  complexes: DayToday['complexes'];
  currentId: number;
  onPick: (id: number) => void;
};

// «Другой комплекс» — порт OtherComplexSheet.tsx: до начала тренировки любой комплекс активной программы
// вместо предложенного (frontend-tz, 8.5)
export const OtherComplexSheet = ({
  open,
  onOpenChange,
  programName,
  complexes,
  currentId,
  onPick,
}: OtherComplexSheetProps) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
    title="Другая тренировка"
    description={complexes.length ? `${programName}. Очередь продолжится с выбранного.` : 'Сначала нужна тренировка'}
  >
    <View className="gap-3">
      {/* Кнопку не блокируем: без объяснения непонятно, почему она не жмётся */}
      {complexes.length === 0 && (
        <>
          <Text tone="soft">
            {programName
              ? 'В программе пока нет тренировок — добавь хотя бы одну, чтобы было что выбрать.'
              : 'Нет активной программы — выбери или собери её, чтобы было из чего выбрать тренировку.'}
          </Text>
          <ButtonLink href={ROUTES.PROGRAMS} block onNavigate={() => onOpenChange(false)}>
            К программам
          </ButtonLink>
        </>
      )}
      {complexes.map((c, i) => (
        <OptionButton
          key={c.id}
          mark={complexLetter(i)}
          title={c.name}
          meta={`${pluralize(c.exerciseCount, EXERCISE_FORMS)}${c.isNext ? ' · на очереди' : ''}`}
          selected={c.id === currentId}
          onPress={() => {
            onPick(c.id);
            onOpenChange(false);
          }}
        />
      ))}
    </View>
  </Sheet>
);
