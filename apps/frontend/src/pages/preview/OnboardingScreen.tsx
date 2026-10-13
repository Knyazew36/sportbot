import { ArrowRightIcon, CheckIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { ROUTES } from '@/shared/config/paths'
import { OptionButton } from '@/shared/ui/kit/OptionButton'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { StepBar } from '@/shared/ui/kit/StepBar'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { templates, WEEKDAYS } from './model/mock'

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

// Первый запуск: 3 шага, у каждого значение по умолчанию и «Дальше» (business-tz, раздел 13).
// Продолжается с того шага, где остановились в боте или приложении; часовой пояс тут не спрашивается — Москва
const OnboardingScreen = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [days, setDays] = useState<string[]>(['Пн', 'Ср', 'Пт'])
  const [program, setProgram] = useState<number | 'scratch'>(templates[0]!.id)
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
            className='px-5 pt-3'
          />
        </>
      }
      footer={
        <StickyFooter className='grid grid-cols-[auto_minmax(0,1fr)] gap-2'>
          <Button
            variant='outline'
            size='xl'
            className='px-4'
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
          >
            Назад
          </Button>
          <Button
            size='xl'
            className='justify-between'
            disabled={step === 0 && days.length === 0}
            onClick={() => (last ? navigate(ROUTES.PREVIEW_TODAY) : setStep(s => s + 1))}
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
      className='px-5'
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
        <Rise className='flex flex-col gap-3'>
          <ToggleGroup
            multiple
            value={days}
            onValueChange={setDays}
            className='grid w-full grid-cols-7'
            aria-label='Тренировочные дни'
          >
            {WEEKDAYS.map(d => (
              <ToggleGroupItem
                key={d}
                value={d}
                className='h-12 px-0'
              >
                {d}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Eyebrow as='p'>{days.length === 0 ? 'выбери хотя бы один день' : `${days.length} в неделю`}</Eyebrow>
        </Rise>
      )}

      {step === 1 && (
        <Rise className='grid grid-cols-2 gap-3'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='ob-morning'>Утренний вопрос</Label>
            <Input
              id='ob-morning'
              type='time'
              defaultValue='08:30'
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='ob-evening'>Вечерний вопрос</Label>
            <Input
              id='ob-evening'
              type='time'
              defaultValue='20:00'
            />
          </div>
          <Text
            size='xs'
            tone='muted'
            className='col-span-2'
          >
            Время московское. Часовой пояс меняется в профиле.
          </Text>
        </Rise>
      )}

      {step === 2 && (
        <Rise className='flex flex-col gap-2'>
          {[
            ...templates.map(t => ({
              id: t.id as number | 'scratch',
              title: t.title,
              meta: `${t.days} дня в неделю · ${t.level}`,
            })),
            { id: 'scratch' as const, title: 'С нуля', meta: 'соберу программу сам' },
          ].map(option => {
            const on = program === option.id
            return (
              <OptionButton
                key={option.id}
                title={option.title}
                meta={option.meta}
                selected={on}
                onClick={() => setProgram(option.id)}
              />
            )
          })}
        </Rise>
      )}
    </Screen>
  )
}

export default OnboardingScreen
