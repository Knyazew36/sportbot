import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChartNoAxesColumn, Plus } from 'lucide-react-native';

import type { DayToday } from '@sportbot/api/entities/day';

import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Rise } from '@/shared/ui/kit/Reveal';

import { workoutHref } from '../model/cta';
import { DoneHero } from './DoneHero';
import { ForgottenMuscles } from './ForgottenMuscles';
import { FriendsToday } from './FriendsToday';
import { NextUp } from './NextUp';
import { OtherComplexSheet } from './OtherComplexSheet';
import { WeekStreak } from './WeekStreak';
import { WorkoutTotals } from './WorkoutTotals';

// Тренировка засчитана — порт DoneDay.tsx: серия, итог с рекордами, что дальше, неделя, друзья.
// Ещё одна тренировка (внеплановая, как в боте) или статистика — внизу
export const DoneDay = ({ day }: { day: DayToday }) => {
  const [pickOpen, setPickOpen] = useState(false);

  return (
    <>
      <DoneHero day={day} />

      {/* Без тренировки — день отмечен исправлением «тренировка была» */}
      {day.workout && <WorkoutTotals workoutId={day.workout.id} complexName={day.workout.complexName} />}

      <NextUp day={day} />
      <WeekStreak week={day.week} />
      <ForgottenMuscles />
      <FriendsToday />

      <Rise className="flex-row gap-2 px-gutter">
        <View className="flex-1">
          <Button
            variant="outline"
            size="sm"
            block
            icon={Plus}
            disabled={!day.complexes.length}
            onPress={() => setPickOpen(true)}
          >
            Ещё одна тренировка
          </Button>
        </View>
        <ButtonLink
          href={ROUTES.STATS}
          variant="outline"
          size="icon-sm"
          icon={ChartNoAxesColumn}
          accessibilityLabel="Статистика"
        />
      </Rise>

      <OtherComplexSheet
        open={pickOpen}
        onOpenChange={setPickOpen}
        programName={day.programName}
        complexes={day.complexes}
        currentId={-1}
        onPick={(id) => router.push(workoutHref(id))}
      />
    </>
  );
};
