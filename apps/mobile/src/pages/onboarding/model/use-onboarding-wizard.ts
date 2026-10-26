import { useState } from 'react';

import {
  ASK_MODE_FIELDS,
  type OnboardingDaysValues,
  type OnboardingGenderValues,
  type OnboardingProgramValues,
  type OnboardingRemindValues,
  type OnboardingState,
  type OnboardingTimesValues,
  useFinishOnboarding,
  useSaveOnboardingDays,
  useSaveOnboardingGender,
  useSaveOnboardingTimes,
} from '@sportbot/api/entities/onboarding';
import { type Gender, paletteForGender } from '@sportbot/api/entities/profile';

import { useTheme } from '@/shared/theme/ThemeProvider';

import { resumeStep, SCREEN, STEPS } from './steps';

// Ответ «Напоминать?» известен, только если шаг со временем уже сохранён
const savedRemind = (state: OnboardingState): OnboardingRemindValues['remind'] | undefined =>
  state.step > 2 ? (state.questionsEnabled ? 'yes' : 'no') : undefined;

/**
 * Первый запуск: пол и три шага с значениями по умолчанию. Продолжается с того шага,
 * где остановились в боте или приложении. Каждый шаг сохраняется на сервере до перехода к следующему.
 * Логика — как во фронте (pages/onboarding/model/use-onboarding-wizard.ts), без JSX
 */
export const useOnboardingWizard = (state: OnboardingState) => {
  const [step, setStep] = useState<number>(state.gender ? resumeStep(state.step) : SCREEN.gender);
  const [remind, setRemind] = useState(() => savedRemind(state));
  const { setPalette } = useTheme();
  const saveGender = useSaveOnboardingGender();
  const saveDays = useSaveOnboardingDays();
  const saveTimes = useSaveOnboardingTimes();
  const finish = useFinishOnboarding();

  return {
    step,
    current: STEPS[step]!,
    last: step === STEPS.length - 1,
    remind,
    pending: saveGender.isPending || saveDays.isPending || saveTimes.isPending || finish.isPending,
    // Отказавшийся от напоминаний экран времени не видел — возвращаем к вопросу
    back: () => setStep((s) => (s === SCREEN.program && remind === 'no' ? SCREEN.remind : s - 1)),
    // Перекрашиваем приложение сразу при выборе пола, до сохранения
    previewGender: (gender: Gender) => setPalette(paletteForGender(gender)),
    // Начавший настройку в боте продолжит со своего шага, а не с «Дней»
    submitGender: (values: OnboardingGenderValues) =>
      saveGender.mutateAsync(values).then((saved) => {
        setPalette(paletteForGender(values.gender));
        setStep(resumeStep(saved.step));
      }),
    submitDays: (values: OnboardingDaysValues) => saveDays.mutateAsync(values).then(() => setStep(SCREEN.remind)),
    // «Нет» — бот не пишет, время оставляем как есть, экран времени пропускаем
    submitRemind: async (values: OnboardingRemindValues) => {
      setRemind(values.remind);
      if (values.remind === 'yes') return setStep(SCREEN.times);
      await saveTimes.mutateAsync({
        morningTime: state.morningTime,
        eveningTime: state.eveningTime,
        ...ASK_MODE_FIELDS.off,
      });
      setStep(SCREEN.program);
    },
    submitTimes: ({ askMode, ...times }: OnboardingTimesValues) =>
      saveTimes.mutateAsync({ ...times, ...ASK_MODE_FIELDS[askMode] }).then(() => setStep(SCREEN.program)),
    // После конца настройки гвард сам уведёт на «Сегодня»
    submitProgram: ({ choice }: OnboardingProgramValues) =>
      finish.mutateAsync(choice === 'scratch' ? { scratch: true } : { templateId: choice }),
  };
};
