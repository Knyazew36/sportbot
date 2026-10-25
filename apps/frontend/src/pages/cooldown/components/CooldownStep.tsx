import { BanIcon, InfoIcon, ListIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'

import { stretchGuide } from '@sportbot/api/entities/catalog/lib'
import { toAssetUrl } from '@/shared/api'
import { timerEndSignal } from '@/shared/lib/signal'
import { MistakeList } from '@/shared/ui/kit/MistakeList'
import { PhotoPair } from '@/shared/ui/kit/PhotoPair'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { HoldControls } from '@/widgets/catalog/HoldControls'
import { ImageCredit } from '@/widgets/catalog/ImageCredit'
import { VideoLink } from '@/widgets/catalog/VideoLink'

import type { CooldownFlow } from '../model/use-cooldown-flow'
import { CooldownProgress } from './CooldownProgress'
import { CooldownDetailSheet, CooldownListSheet } from './CooldownSheets'
import { SideTrack } from './SideTrack'

type CooldownStepProps = {
  flow: CooldownFlow
  index: number
  side: 1 | 2
}

// Одна растяжка: фото позы, шаги, ошибки и таймер удержания. Следующую человек открывает сам
export const CooldownStep = ({ flow, index, side }: CooldownStepProps) => {
  const { cooldown, all } = flow
  const stretch = all[index]
  // Растяжку убрали без замены, номер шага поправится следующим рендером
  if (!stretch) return null
  const { steps, mistakes } = stretchGuide(stretch)
  const inMain = index < cooldown.main.length
  const isLast =
    (index === all.length - 1 || (inMain && index === cooldown.main.length - 1)) && (!stretch.perSide || side === 2)
  const key = `${index}-${stretch.id}-${side}`

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={`screen-${key}`}
        header={
          <>
            <TopBar
              back={flow.back}
              title='Заминка'
              subtitle={`растяжка ${index + 1} из ${all.length} · ~${cooldown.minutes} мин`}
              action={
                <div className='flex items-center gap-2'>
                  {/* Шторка поверх: таймер удержания под ней продолжает идти */}
                  <Button
                    variant='alert'
                    size='icon'
                    onClick={() => flow.open(stretch)}
                    aria-label='Карточка растяжки'
                  >
                    <InfoIcon className='size-5' />
                  </Button>
                  <Button
                    variant='alert'
                    size='icon'
                    onClick={() => flow.setListOpen(true)}
                    aria-label='Весь список'
                  >
                    <ListIcon className='size-5' />
                  </Button>
                  {/* Заминка не влияет на засчитывание — выйти можно в любой момент без подтверждения */}
                  <Button
                    variant='destructive'
                    size='sm'
                    className='h-10'
                    onClick={flow.finish}
                  >
                    Завершить
                  </Button>
                </div>
              }
            />
            <CooldownProgress
              ids={all.map(s => s.id)}
              current={index}
              mainCount={cooldown.main.length}
            />
          </>
        }
        className='gap-5 px-gutter pt-4'
      >
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
            {inMain ? 'Основной блок' : 'Если есть время'} · {stretch.muscles}
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
          {/* Не подходит — сервер сразу ставит другую на те же мышцы, дальше эта не попадётся */}
          <Button
            variant='outline'
            size='sm'
            className='mt-3'
            disabled={flow.excludePending}
            onClick={() => flow.excludeStretch(stretch.id)}
          >
            <BanIcon />
            Не предлагать
          </Button>
        </Rise>
        {stretch.perSide && (
          <Rise>
            <SideTrack side={side} />
          </Rise>
        )}
        {steps.length > 0 && (
          <Rise>
            <StepList
              items={steps}
              size='lg'
            />
          </Rise>
        )}
        {mistakes.length > 0 && (
          <Rise>
            <ScreenSection title='Типичные ошибки'>
              <MistakeList items={mistakes} />
            </ScreenSection>
          </Rise>
        )}
        <Rise className='flex pb-4'>
          <VideoLink
            name={stretch.name}
            videoUrl={stretch.videoUrl}
          />
        </Rise>
      </Screen>

      {/* Ключи соседей разные: одинаковые сломали бы сверку React и старый экран оставался бы рядом с новым */}
      <HoldControls
        key={`hold-${key}`}
        holdSeconds={stretch.holdSeconds}
        side={stretch.perSide ? side : undefined}
        back={{ label: 'Назад', icon: SkipBackIcon, onClick: flow.prev }}
        next={{
          label: stretch.perSide && side === 1 ? 'Левая' : isLast ? 'Готово' : 'Дальше',
          icon: SkipForwardIcon,
          onClick: flow.next,
        }}
        // Без автоперехода: следующую растяжку человек открывает сам, когда прочитал и готов
        onEnd={() => timerEndSignal(cooldown)}
      />
      <CooldownListSheet flow={flow} />
      <CooldownDetailSheet flow={flow} />
    </div>
  )
}
