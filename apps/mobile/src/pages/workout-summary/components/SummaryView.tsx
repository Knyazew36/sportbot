import { ArrowRight } from 'lucide-react-native';

import { type WorkoutSummary } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { WorkoutRecords } from '@/widgets/workout-records/WorkoutRecords';
import { SummaryTiming } from '@/widgets/workout-summary/SummaryTiming';
import { WorkoutProtocol } from '@/widgets/workout-summary/WorkoutProtocol';

import { CooldownNudge } from './CooldownNudge';
import { SummaryHero } from './SummaryHero';
import { SummaryStats } from './SummaryStats';

export const SummaryView = ({ summary }: { summary: WorkoutSummary }) => {
  const counted = summary.status !== 'IN_PROGRESS';
  // Без замера времени (старые тренировки, простой режим) не знаем, была ли заминка — напоминаем
  const cooldownMissed = counted && summary.timing?.cooldownSeconds == null;

  return (
    <Screen
      header={<ScreenHeader title="Финиш" aside={summary.complexName} />}
      footer={
        <StickyFooter>
          <ButtonLink href={ROUTES.TODAY} replace size="lg">
            Домой
            <Icon as={ArrowRight} className="size-6" strokeWidth={2.5} />
          </ButtonLink>
        </StickyFooter>
      }
    >
      <SummaryHero summary={summary} />

      {/* Рекорды — пик экрана, сразу за серией, а не после сухих цифр */}
      {summary.records.length > 0 && (
        <ScreenSection title="Рекорды" aside={summary.records.length}>
          <WorkoutRecords records={summary.records} />
        </ScreenSection>
      )}

      <SummaryStats summary={summary} />

      {/* Старые тренировки и простой режим без времени подходов — блока нет */}
      {summary.timing && <SummaryTiming timing={summary.timing} />}

      <WorkoutProtocol workoutId={summary.workoutId} />

      {/* Напоминание — последним: итог важнее, а вернуться к заминке можно и после него */}
      {cooldownMissed && <CooldownNudge workoutId={summary.workoutId} />}
    </Screen>
  );
};
