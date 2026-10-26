import type { OnboardingRemindValues, OnboardingTimesValues } from '@sportbot/api/entities/onboarding';

export const REMIND_OPTIONS = [
  { value: 'yes', label: 'Да' },
  { value: 'no', label: 'Нет' },
] as const;

export const REMIND_HINT: Record<OnboardingRemindValues['remind'], string> = {
  yes: 'Дальше выберешь, во сколько писать.',
  no: 'Бот сам не пишет. Тренировки отмечаешь в приложении, день без отметки — пропуск.',
};

export const ASK_MODES = [
  { value: 'remind', label: 'Повторять' },
  { value: 'once', label: 'Один раз' },
] as const;

export const ASK_MODE_HINT: Record<OnboardingTimesValues['askMode'], string> = {
  remind: 'Не ответишь — утренний вопрос повторю через 2 часа, вечерний на следующее утро.',
  once: 'Каждый вопрос приходит один раз, без повторов.',
};
