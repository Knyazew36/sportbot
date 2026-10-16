import { ArrowRightIcon, CheckIcon } from 'lucide-react'

import { useState } from 'react'

import {
  type OnboardingState,
  useFinishOnboarding,
  useOnboarding,
  useSaveOnboardingDays,
  useSaveOnboardingGender,
  useSaveOnboardingTimes,
} from '@/entities/onboarding'
import { paletteForGender, usePaletteChoice } from '@/shared/lib/hooks/use-palette'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { StepDays } from './components/StepDays'
import { StepGender } from './components/StepGender'
import { StepProgram } from './components/StepProgram'
import { StepTimes } from './components/StepTimes'

const FORM_ID = 'onboarding-step'

const STEPS = [
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
const resumeStep = (state: OnboardingState) => Math.min(Math.max(state.step, 1), STEPS.length - 1)

// Первый запуск (business-tz, 13): пол и три шага с значениями по умолчанию. Продолжается с того шага,
// где остановились в боте или приложении; часовой пояс тут не спрашивается — Москва
const Wizard = ({ state }: { state: OnboardingState }) => {
  const [step, setStep] = useState(state.gender ? resumeStep(state) : 0)
  const [, setPalette] = usePaletteChoice()
  const saveGender = useSaveOnboardingGender()
  const saveDays = useSaveOnboardingDays()
  const saveTimes = useSaveOnboardingTimes()
  const finish = useFinishOnboarding()
  const pending = saveGender.isPending || saveDays.isPending || saveTimes.isPending || finish.isPending
  const current = STEPS[step]!
  const last = step === STEPS.length - 1

  return (
    <Screen
      key={step}
      header={
        <>
          <ScreenHeader
            title='Спортбот · настройка'
            aside={`шаг ${step + 1} из ${STEPS.length}`}
          />
          <StepBar
            total={STEPS.length}
            current={step}
            className='px-gutter pt-3'
          />
        </>
      }
      footer={
        <StickyFooter>
          <Button
            variant='outline'
            size='lg'
            disabled={step === 0 || pending}
            onClick={() => setStep(s => s - 1)}
          >
            Назад
          </Button>
          <Button
            type='submit'
            form={FORM_ID}
            size='lg'
            disabled={pending}
          >
            {last ? 'Начать' : 'Дальше'}
            {last ? (
              <CheckIcon
                className='size-7'
                strokeWidth={3}
              />
            ) : (
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            )}
          </Button>
        </StickyFooter>
      }
      className='px-gutter'
    >
      <Rise>
        <Lead>{current.lead}</Lead>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          fit
          className='mt-1'
        >
          {current.title}
        </Poster>
        <Text
          tone='soft'
          className='mt-4'
        >
          {current.hint}
        </Text>
      </Rise>

      {step === 0 && (
        <StepGender
          formId={FORM_ID}
          defaultValues={{ gender: state.gender ?? undefined }}
          // Начавший настройку в боте продолжит со своего шага, а не с «Дней»
          onSubmit={values =>
            saveGender.mutateAsync(values).then(saved => {
              setPalette(paletteForGender(values.gender))
              setStep(resumeStep(saved))
            })
          }
        />
      )}
      {step === 1 && (
        <StepDays
          formId={FORM_ID}
          defaultValues={{ trainingDays: state.trainingDays }}
          onSubmit={values => saveDays.mutateAsync(values).then(() => setStep(2))}
        />
      )}
      {step === 2 && (
        <StepTimes
          formId={FORM_ID}
          defaultValues={{ morningTime: state.morningTime, eveningTime: state.eveningTime }}
          onSubmit={values => saveTimes.mutateAsync(values).then(() => setStep(3))}
        />
      )}
      {/* После конца настройки гард сам уведёт на «Сегодня» */}
      {step === 3 && (
        <StepProgram
          formId={FORM_ID}
          templates={state.templates}
          onSubmit={({ choice }) =>
            finish.mutateAsync(choice === 'scratch' ? { scratch: true } : { templateId: choice })
          }
        />
      )}
    </Screen>
  )
}

const OnboardingPage = () => {
  const onboarding = useOnboarding()

  return (
    <QueryScreen
      query={onboarding}
      rows={3}
    >
      {state => <Wizard state={state} />}
    </QueryScreen>
  )
}

export default OnboardingPage
