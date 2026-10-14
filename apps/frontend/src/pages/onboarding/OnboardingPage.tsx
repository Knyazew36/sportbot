import { ArrowRightIcon, CheckIcon } from 'lucide-react'

import { useState } from 'react'

import {
  type OnboardingState,
  useFinishOnboarding,
  useOnboarding,
  useSaveOnboardingDays,
  useSaveOnboardingTimes,
} from '@/entities/onboarding'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { StepDays } from './components/StepDays'
import { StepProgram } from './components/StepProgram'
import { StepTimes } from './components/StepTimes'

const FORM_ID = 'onboarding-step'

const STEPS = [
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

// Первый запуск (business-tz, 13): три шага с значениями по умолчанию. Продолжается с того шага,
// где остановились в боте или приложении; часовой пояс тут не спрашивается — Москва
const Wizard = ({ state }: { state: OnboardingState }) => {
  const [step, setStep] = useState(Math.min(Math.max(state.step, 1), STEPS.length) - 1)
  const saveDays = useSaveOnboardingDays()
  const saveTimes = useSaveOnboardingTimes()
  const finish = useFinishOnboarding()
  const pending = saveDays.isPending || saveTimes.isPending || finish.isPending
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
        <StickyFooter className='grid grid-cols-[auto_minmax(0,1fr)] gap-2'>
          <Button
            variant='outline'
            size='xl'
            className='px-4'
            disabled={step === 0 || pending}
            onClick={() => setStep(s => s - 1)}
          >
            Назад
          </Button>
          <Button
            type='submit'
            form={FORM_ID}
            size='xl'
            className='justify-between'
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
        <StepDays
          formId={FORM_ID}
          defaultValues={{ trainingDays: state.trainingDays }}
          onSubmit={values => saveDays.mutateAsync(values).then(() => setStep(1))}
        />
      )}
      {step === 1 && (
        <StepTimes
          formId={FORM_ID}
          defaultValues={{ morningTime: state.morningTime, eveningTime: state.eveningTime }}
          onSubmit={values => saveTimes.mutateAsync(values).then(() => setStep(2))}
        />
      )}
      {/* После конца настройки гард сам уведёт на «Сегодня» */}
      {step === 2 && (
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
