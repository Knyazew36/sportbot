import { useState } from 'react'

import {
  ASK_MODE_FIELDS,
  type OnboardingDaysValues,
  type OnboardingGenderValues,
  type OnboardingProgramValues,
  type OnboardingState,
  type OnboardingTimesValues,
  useFinishOnboarding,
  useSaveOnboardingDays,
  useSaveOnboardingGender,
  useSaveOnboardingTimes,
} from '@sportbot/api/entities/onboarding'
import { paletteForGender } from '@sportbot/api/entities/profile'
import { usePaletteChoice } from '@/shared/lib/hooks/use-palette'

import { resumeStep, STEPS } from './steps'

/**
 * Первый запуск (business-tz, 13): пол и три шага с значениями по умолчанию. Продолжается с того шага,
 * где остановились в боте или приложении. Каждый шаг сохраняется на сервере до перехода к следующему
 */
export const useOnboardingWizard = (state: OnboardingState) => {
  const [step, setStep] = useState(state.gender ? resumeStep(state) : 0)
  const [, setPalette] = usePaletteChoice()
  const saveGender = useSaveOnboardingGender()
  const saveDays = useSaveOnboardingDays()
  const saveTimes = useSaveOnboardingTimes()
  const finish = useFinishOnboarding()

  return {
    step,
    current: STEPS[step]!,
    last: step === STEPS.length - 1,
    pending: saveGender.isPending || saveDays.isPending || saveTimes.isPending || finish.isPending,
    back: () => setStep(s => s - 1),
    // Начавший настройку в боте продолжит со своего шага, а не с «Дней»
    submitGender: (values: OnboardingGenderValues) =>
      saveGender.mutateAsync(values).then(saved => {
        setPalette(paletteForGender(values.gender))
        setStep(resumeStep(saved))
      }),
    submitDays: (values: OnboardingDaysValues) => saveDays.mutateAsync(values).then(() => setStep(2)),
    submitTimes: ({ askMode, ...times }: OnboardingTimesValues) =>
      saveTimes.mutateAsync({ ...times, ...ASK_MODE_FIELDS[askMode] }).then(() => setStep(3)),
    // После конца настройки гард сам уведёт на «Сегодня»
    submitProgram: ({ choice }: OnboardingProgramValues) =>
      finish.mutateAsync(choice === 'scratch' ? { scratch: true } : { templateId: choice }),
  }
}
