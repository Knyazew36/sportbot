import { ArrowRightIcon, CheckIcon } from 'lucide-react'

import type { OnboardingState } from '@sportbot/api/entities/onboarding'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { FORM_ID, SCREEN, STEPS } from '../model/steps'
import { useOnboardingWizard } from '../model/use-onboarding-wizard'
import { StepDays } from './StepDays'
import { StepGender } from './StepGender'
import { StepProgram } from './StepProgram'
import { StepRemind } from './StepRemind'
import { StepTimes } from './StepTimes'

// Мастер первого запуска: шапка с шагом, вводная шага, форма шага и «Назад / Дальше»
export const Wizard = ({ state }: { state: OnboardingState }) => {
  const wizard = useOnboardingWizard(state)
  const { step, current, last, pending } = wizard

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
          {/* На первом шаге возвращаться некуда */}
          {step > 0 && (
            <Button
              variant='outline'
              size='lg'
              disabled={pending}
              onClick={wizard.back}
            >
              Назад
            </Button>
          )}
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

      {step === SCREEN.gender && (
        <StepGender
          formId={FORM_ID}
          defaultValues={{ gender: state.gender ?? undefined }}
          onSubmit={wizard.submitGender}
        />
      )}
      {step === SCREEN.days && (
        <StepDays
          formId={FORM_ID}
          defaultValues={{ trainingDays: state.trainingDays }}
          onSubmit={wizard.submitDays}
        />
      )}
      {step === SCREEN.remind && (
        <StepRemind
          formId={FORM_ID}
          defaultValues={{ remind: wizard.remind }}
          onSubmit={wizard.submitRemind}
        />
      )}
      {step === SCREEN.times && (
        <StepTimes
          formId={FORM_ID}
          defaultValues={{ morningTime: state.morningTime, eveningTime: state.eveningTime }}
          onSubmit={wizard.submitTimes}
        />
      )}
      {/* После конца настройки гард сам уведёт на «Сегодня» */}
      {step === SCREEN.program && (
        <StepProgram
          formId={FORM_ID}
          templates={state.templates}
          onSubmit={wizard.submitProgram}
        />
      )}
    </Screen>
  )
}
