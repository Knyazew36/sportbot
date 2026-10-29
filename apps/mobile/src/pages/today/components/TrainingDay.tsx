import { type DayToday } from '@sportbot/api/entities/day';

import { ComplexExercises } from './ComplexExercises';
import { ComplexPoster } from './ComplexPoster';
import { ComplexQueue } from './ComplexQueue';
import { EveningQuestion } from './EveningQuestion';
import { WeekStreak } from './WeekStreak';

type TrainingDayProps = {
  day: DayToday;
  onPickComplex: (id: number) => void;
  onMissed: (suggestPause: boolean) => void;
};

// Тренировочный день, тренировки ещё не было — порт TrainingDay.tsx: комплекс по очереди.
// «Другая тренировка» и «Сегодня не буду» — в DayMenu у кнопки «Начать»
export const TrainingDay = ({ day, onPickComplex, onMissed }: TrainingDayProps) => {
  const complex = day.complex!;

  return (
    <>
      {day.eveningAsked && <EveningQuestion onMissed={onMissed} />}
      <ComplexPoster complex={complex} complexes={day.complexes} />
      <WeekStreak week={day.week} />
      <ComplexQueue currentId={complex.id} byQueue={complex.byQueue} onPick={onPickComplex} />
      <ComplexExercises complex={complex} />
    </>
  );
};
