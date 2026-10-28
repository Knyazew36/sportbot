import { View } from 'react-native';

import type { DayToday } from '@sportbot/api/entities/day';
import { useEndPause } from '@/shared/local/entities/day';

import { ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Hatch } from '@/shared/ui/kit/Patterns';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography';

import { NextUp } from './NextUp';

const TRAINING_SECTION = { pathname: ROUTES.ME_SECTION, params: { section: 'training' } } as const;

// Пауза — порт PauseDay.tsx: бот молчит, серия заморожена. Срок вышел — вопрос «Возвращаемся?» (business-tz, 8.5)
export const PauseDay = ({ day }: { day: DayToday }) => {
  const { colors } = useTheme();
  const pause = day.pause!;
  const end = useEndPause();

  if (pause.expired) {
    return (
      <>
        <Rise className="px-gutter">
          <Eyebrow>Пауза закончилась</Eyebrow>
          <Poster size="display" tone="primary" numberOfLines={2} adjustsFontSizeToFit className="mt-4">
            Возвра{'­'}щаемся?
          </Poster>
        </Rise>
        <Rise className="flex-row gap-2 px-gutter">
          <View className="flex-1">
            <Button block disabled={end.isPending} onPress={() => end.mutate()}>
              Да
            </Button>
          </View>
          <View className="flex-1">
            <ButtonLink href={TRAINING_SECTION} variant="outline" block>
              Продлить
            </ButtonLink>
          </View>
        </Rise>
      </>
    );
  }

  return (
    <>
      <Rise className="px-gutter">
        <Eyebrow>Бот молчит, серия сохранена</Eyebrow>
        <Poster size="display" tone="primary" className="mt-4">
          {'на\nпаузе'}
        </Poster>
        <Lead size="xl" className="mt-3">
          {pause.endDate ? `до ${formatDate(pause.endDate, 'd MMMM')}` : 'до отмены'}
        </Lead>
      </Rise>
      <Rise className="border-border mx-gutter h-28 overflow-hidden border-[1.5px] opacity-60">
        <Hatch color={colors.hatch} />
      </Rise>
      {/* Пауза до отмены — даты нет, и «что дальше» не показываем */}
      {day.next?.date && <NextUp day={day} label="после паузы" />}
      <Rise className="px-gutter">
        <Button block disabled={end.isPending} onPress={() => end.mutate()}>
          Снять паузу
        </Button>
      </Rise>
    </>
  );
};
