import { useState } from 'react';
import { View } from 'react-native';
import { CalendarX, Ellipsis, Shuffle } from 'lucide-react-native';

import { type DayToday } from '@sportbot/api/entities/day';
import { useSkipDay } from '@/shared/local/entities/day';

import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Icon } from '@/shared/ui/kit/Icon';
import { Sheet } from '@/shared/ui/kit/Sheet';

import { OtherComplexSheet } from './OtherComplexSheet';

type DayMenuProps = {
  day: DayToday;
  onPickComplex: (id: number) => void;
  onMissed: (suggestPause: boolean) => void;
};

// Запасные действия тренировочного дня — кнопкой ⋯ рядом с «Начать»: у большого пальца, но не спорят
// с главным действием. В ленте под упражнениями до них приходилось долистывать
export const DayMenu = ({ day, onPickComplex, onMissed }: DayMenuProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const skip = useSkipDay();

  return (
    <>
      <Button variant="outline" size="lg" accessibilityLabel="Другие действия" onPress={() => setMenuOpen(true)}>
        <Icon as={Ellipsis} className="size-6" />
      </Button>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="Сегодня">
        <View className="gap-3">
          <Button
            variant="outline"
            block
            icon={Shuffle}
            disabled={day.complexes.length < 2}
            onPress={() => {
              setMenuOpen(false);
              setOtherOpen(true);
            }}
          >
            Другая тренировка
          </Button>
          <ConfirmAction
            title="Сегодня не будешь?"
            description="Запишу пропуск. Бот про сегодняшний день больше не спросит."
            confirmLabel="Записать пропуск"
            confirmVariant="default"
            onConfirm={() =>
              skip.mutateAsync().then((result) => {
                setMenuOpen(false);
                onMissed(result.suggestPause);
              })
            }
            trigger={<Button variant="outline" block icon={CalendarX} />}
          >
            Сегодня не буду
          </ConfirmAction>
        </View>
      </Sheet>

      <OtherComplexSheet
        open={otherOpen}
        onOpenChange={setOtherOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={day.complex!.id}
        onPick={onPickComplex}
      />
    </>
  );
};
