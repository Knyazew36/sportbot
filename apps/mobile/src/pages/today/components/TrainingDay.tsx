import { useState } from 'react';
import { View } from 'react-native';
import { Shuffle } from 'lucide-react-native';

import { type DayToday } from '@sportbot/api/entities/day';
import { useSkipDay } from '@/shared/local/entities/day';

import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Rise } from '@/shared/ui/kit/Reveal';

import { ComplexExercises } from './ComplexExercises';
import { ComplexPoster } from './ComplexPoster';
import { ComplexQueue } from './ComplexQueue';
import { EveningQuestion } from './EveningQuestion';
import { OtherComplexSheet } from './OtherComplexSheet';
import { WeekStreak } from './WeekStreak';

type TrainingDayProps = {
  day: DayToday;
  onPickComplex: (id: number) => void;
  onMissed: (suggestPause: boolean) => void;
};

// Тренировочный день, тренировки ещё не было — порт TrainingDay.tsx: комплекс по очереди,
// «Другая тренировка», «Сегодня не буду»
export const TrainingDay = ({ day, onPickComplex, onMissed }: TrainingDayProps) => {
  const [otherOpen, setOtherOpen] = useState(false);
  const skip = useSkipDay();
  const complex = day.complex!;

  return (
    <>
      {day.eveningAsked && <EveningQuestion onMissed={onMissed} />}
      <ComplexPoster complex={complex} complexes={day.complexes} />
      <WeekStreak week={day.week} />
      <ComplexQueue currentId={complex.id} byQueue={complex.byQueue} onPick={onPickComplex} />
      <ComplexExercises complex={complex} />

      {/* Подписи переносятся: на узком экране две кнопки в строку не влезают в одну линию */}
      <Rise className="flex-row gap-2 px-gutter">
        <View className="flex-1">
          <Button
            variant="outline"
            size="sm"
            block
            icon={Shuffle}
            disabled={day.complexes.length < 2}
            onPress={() => setOtherOpen(true)}
          >
            Другая тренировка
          </Button>
        </View>
        <View className="flex-1">
          <ConfirmAction
            title="Сегодня не будешь?"
            description="Запишу пропуск. Бот про сегодняшний день больше не спросит."
            confirmLabel="Записать пропуск"
            confirmVariant="default"
            onConfirm={() => skip.mutateAsync().then((result) => onMissed(result.suggestPause))}
            trigger={<Button variant="outline" size="sm" block />}
          >
            Сегодня не буду
          </ConfirmAction>
        </View>
      </Rise>

      <OtherComplexSheet
        open={otherOpen}
        onOpenChange={setOtherOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={complex.id}
        onPick={onPickComplex}
      />
    </>
  );
};
