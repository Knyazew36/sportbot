import type { ReactNode } from 'react'

import { stretchGuide } from '@sportbot/api/entities/catalog/lib'
import type { Cooldown } from '@sportbot/api/entities/workout'
import { toAssetUrl } from '@/shared/api'
import { PhotoPair } from '@/shared/ui/kit/PhotoPair'
import { Rise } from '@/shared/ui/kit/Reveal'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { ImageCredit } from '@/widgets/catalog/ImageCredit'

import { SideTrack } from './SideTrack'

type StretchStepBodyProps = {
  stretch: Cooldown['main'][number]
  side: 1 | 2
  eyebrow: string
  /** Кнопки под названием: у заминки и отдельного занятия они разные */
  actions: ReactNode
}

// Одна растяжка на экране прохождения: фото позы, что тянет, сторона и шаги
export const StretchStepBody = ({ stretch, side, eyebrow, actions }: StretchStepBodyProps) => {
  const { steps } = stretchGuide(stretch)
  return (
    <>
      {/* Старт и финиш рядом: поза читается без видео. На низком экране фото прячем ради таймера */}
      <Rise className='flex flex-col gap-1.5 [@media(max-height:620px)]:hidden'>
        <PhotoPair
          start={toAssetUrl(stretch.imageUrl) ?? null}
          end={toAssetUrl(stretch.imageEndUrl) ?? null}
          alt={stretch.name}
        />
        <ImageCredit credit={stretch.imageCredit} />
      </Rise>
      <Rise>
        <Eyebrow
          as='p'
          tone='primary'
        >
          {eyebrow}
        </Eyebrow>
        <Poster
          as='h1'
          size='2xl'
          className='mt-2 hyphens-auto'
        >
          {stretch.name}
        </Poster>
        {stretch.feel && (
          <Text
            tone='soft'
            className='mt-2'
          >
            Тянет: {stretch.feel}
          </Text>
        )}
        <div className='mt-3 flex flex-wrap gap-2'>{actions}</div>
      </Rise>
      {stretch.perSide && (
        <Rise>
          <SideTrack side={side} />
        </Rise>
      )}
      {/* Ошибки и видео — в «Подробнее»: на полу с экрана читают только как встать */}
      {steps.length > 0 && (
        <Rise className='pb-4'>
          <StepList
            items={steps}
            size='lg'
          />
        </Rise>
      )}
    </>
  )
}
