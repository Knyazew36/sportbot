import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Check } from 'lucide-react-native';

import type { OnboardingState } from '@sportbot/api/entities/onboarding';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { StepBar } from '@/shared/ui/kit/StepBar';
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';

import { STEPS, type StepHandle } from '../model/steps';
import { useOnboardingWizard } from '../model/use-onboarding-wizard';
import { StepDays } from './StepDays';
import { StepGender } from './StepGender';
import { StepProgram } from './StepProgram';
import { StepTimes } from './StepTimes';

// Мастер первого запуска: шапка с шагом, вводная шага, форма шага и «Назад / Дальше» — порт Wizard.tsx.
// Кнопка «Дальше» в липком низе сабмитит форму активного шага через ref
export const Wizard = ({ state }: { state: OnboardingState }) => {
  const wizard = useOnboardingWizard(state);
  const { step, current, last, pending } = wizard;
  const stepRef = useRef<StepHandle>(null);

  return (
    <Screen
      scroll={false}
      fullscreen
      header={
        <View>
          <ScreenHeader title="Спортбот · настройка" aside={`шаг ${step + 1} из ${STEPS.length}`} />
          <StepBar total={STEPS.length} current={step} />
        </View>
      }
      footer={
        <StickyFooter>
          <Button variant="outline" size="lg" disabled={step === 0 || pending} onPress={wizard.back}>
            Назад
          </Button>
          <Button size="lg" loading={pending} iconRight={last ? Check : undefined} onPress={() => stepRef.current?.submit()}>
            {last ? 'Начать' : 'Дальше'}
          </Button>
        </StickyFooter>
      }
    >
      <ScrollView contentContainerClassName="px-gutter gap-6">
        <View className="gap-1">
          <Lead>{current.lead}</Lead>
          <Poster size="display" tone="primary" numberOfLines={1}>
            {current.title}
          </Poster>
          <Text tone="soft" className="mt-2">
            {current.hint}
          </Text>
        </View>

        {step === 0 && (
          <StepGender ref={stepRef} defaultValues={{ gender: state.gender ?? undefined }} onSubmit={wizard.submitGender} />
        )}
        {step === 1 && (
          <StepDays ref={stepRef} defaultValues={{ trainingDays: state.trainingDays }} onSubmit={wizard.submitDays} />
        )}
        {step === 2 && (
          <StepTimes
            ref={stepRef}
            defaultValues={{ morningTime: state.morningTime, eveningTime: state.eveningTime }}
            onSubmit={wizard.submitTimes}
          />
        )}
        {/* После конца настройки гвард сам уведёт на «Сегодня» */}
        {step === 3 && <StepProgram ref={stepRef} templates={state.templates} onSubmit={wizard.submitProgram} />}
      </ScrollView>
    </Screen>
  );
};
