import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { sportUserKeys } from '../sport-user'
import type {
  OnboardingDaysDto,
  OnboardingGenderDto,
  OnboardingProgramDto,
  OnboardingStateResponseDto,
  OnboardingTimesDto,
} from '../../generated/model'
import {
  onboardingControllerFinish,
  onboardingControllerSaveDays,
  onboardingControllerSaveGender,
  onboardingControllerSaveTimes,
  onboardingControllerState,
} from '../../generated/onboarding/onboarding'

export type OnboardingState = OnboardingStateResponseDto

export const onboardingKeys = {
  state: ['onboarding'] as const,
}

export const useOnboarding = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: onboardingKeys.state,
    queryFn: () => onboardingControllerState(),
    enabled,
    // Шаг мог сдвинуться в боте, пока приложение было свёрнуто
    staleTime: 0,
  })

const useSaveStep = <T>(save: (body: T) => Promise<OnboardingState>) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: save,
    // Результат виден сразу: открывается следующий шаг
    meta: { skipSuccessToast: true, inlineFieldErrors: true },
    onSuccess: state => queryClient.setQueryData(onboardingKeys.state, state),
  })
}

export const useSaveOnboardingGender = () =>
  useSaveStep((body: OnboardingGenderDto) => onboardingControllerSaveGender(body))

export const useSaveOnboardingDays = () => useSaveStep((body: OnboardingDaysDto) => onboardingControllerSaveDays(body))

export const useSaveOnboardingTimes = () =>
  useSaveStep((body: OnboardingTimesDto) => onboardingControllerSaveTimes(body))

/** Последний шаг: программа и конец настройки — приложение уходит на «Сегодня» */
export const useFinishOnboarding = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: OnboardingProgramDto) => onboardingControllerFinish(body),
    meta: { successMessage: 'Настройка закончена' },
    onSuccess: async state => {
      queryClient.setQueryData(onboardingKeys.state, state)
      await queryClient.invalidateQueries({ queryKey: sportUserKeys.me })
    },
  })
}
