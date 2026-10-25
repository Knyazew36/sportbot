import type { OnboardingState } from '@sportbot/api/entities/onboarding'

export const FORM_ID = 'onboarding-step'

export const STEPS = [
  {
    lead: 'кто тренируется —',
    title: 'Пол',
    hint: 'От него зависит расцветка приложения. Потом можно поменять в профиле.',
  },
  {
    lead: 'когда тренируемся —',
    title: 'Дни',
    hint: 'В эти дни бот утром предложит тренировку. Потом можно поменять в профиле.',
  },
  { lead: 'когда спрашивать —', title: 'Время', hint: 'Утром бот скажет, что по плану. Вечером спросит, как прошло.' },
  {
    lead: 'по чему занимаемся —',
    title: 'Программа',
    hint: 'Возьми готовый шаблон или собери свою. Шаблон потом можно править.',
  },
]

// Серверный шаг 1..3 совпадает с индексом экрана: экран 0 — пол, его спрашивает только приложение
export const resumeStep = (state: OnboardingState) => Math.min(Math.max(state.step, 1), STEPS.length - 1)
