import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { Check } from 'lucide-react-native';

import type { OnboardingState } from '@sportbot/api/entities/onboarding';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { StepBar } from '@/shared/ui/kit/StepBar';
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography';
import { Button } from '@/shared/ui/kit/Button';

import { SCREEN, STEPS, type StepHandle } from '../model/steps';
import { useOnboardingWizard } from '../model/use-onboarding-wizard';
import { StepDays } from './StepDays';
import { StepGender } from './StepGender';
import { StepProgram } from './StepProgram';
import { StepRemind } from './StepRemind';
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
          {/* На первом шаге возвращаться некуда */}
          {step > 0 && (
            <Button variant="outline" size="lg" disabled={pending} onPress={wizard.back}>
              Назад
            </Button>
          )}
          <Button size="lg" loading={pending} iconRight={last ? Check : undefined} onPress={() => stepRef.current?.submit()}>
            {last ? 'Начать' : 'Дальше'}
          </Button>
        </StickyFooter>
      }
    >
      <ScrollView contentContainerClassName="px-gutter gap-6">
        <View className="gap-1">
          <Lead>{current.lead}</Lead>
          <Poster size="display" tone="primary" fit>
            {current.title}
          </Poster>
          <Text tone="soft" className="mt-2">
            {current.hint}
          </Text>
        </View>

        {step === SCREEN.gender && (
          <StepGender
            ref={stepRef}
            defaultValues={{ gender: state.gender ?? undefined }}
            onSubmit={wizard.submitGender}
            onPick={wizard.previewGender}
          />
        )}
        {step === SCREEN.days && (
          <StepDays ref={stepRef} defaultValues={{ trainingDays: state.trainingDays }} onSubmit={wizard.submitDays} />
        )}
        {step === SCREEN.remind && (
          <StepRemind ref={stepRef} defaultValues={{ remind: wizard.remind }} onSubmit={wizard.submitRemind} />
        )}
        {step === SCREEN.times && (
          <StepTimes
            ref={stepRef}
            defaultValues={{ morningTime: state.morningTime, eveningTime: state.eveningTime }}
            onSubmit={wizard.submitTimes}
          />
        )}
        {/* После конца настройки гвард сам уведёт на «Сегодня» */}
        {step === SCREEN.program && <StepProgram ref={stepRef} templates={state.templates} onSubmit={wizard.submitProgram} />}
      </ScrollView>
    </Screen>
  );
};
