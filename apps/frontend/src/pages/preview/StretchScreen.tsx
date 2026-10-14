import { CheckIcon, FlagIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useState } from 'react'

import { muscleNames } from '@/entities/catalog/lib'
import { ROUTES } from '@/shared/config/paths'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ComplaintSheet } from '@/widgets/catalog/ComplaintSheet'
import { HoldControls } from '@/widgets/catalog/HoldControls'

import { stretches } from './model/catalog'

// Карточка растяжки (frontend-tz, 11.3): «Попробовать» запускает таймер удержания, как в заминке
const StretchScreen = () => {
  const { stretchId } = useParams()
  const stretch = stretches.find(s => String(s.id) === stretchId)
  const [side, setSide] = useState<0 | 1 | 2>(0)
  const [complaintOpen, setComplaintOpen] = useState(false)

  if (!stretch) {
    return (
      <Screen
        header={
          <TopBar
            back={`${ROUTES.PREVIEW_LIBRARY}?tab=stretches`}
            title='Растяжка'
          />
        }
        className='px-gutter'
      >
        <ScreenState
          state='empty'
          title='Растяжка не найдена'
          description='Возможно, её убрали из справочника.'
        />
      </Screen>
    )
  }

  return (
    <Screen
      header={
        <TopBar
          back={`${ROUTES.PREVIEW_LIBRARY}?tab=stretches`}
          title={stretch.name}
          subtitle={muscleNames(stretch.muscles)}
        />
      }
      footer={
        side === 0 ? (
          <StickyFooter className='grid grid-cols-[1fr_auto] gap-2'>
            <Button
              size='lg'
              onClick={() => setSide(1)}
            >
              <PlayIcon className='size-5' />
              Попробовать
            </Button>
            <Button
              variant='outline'
              size='icon-lg'
              className='h-[60px]'
              onClick={() => setComplaintOpen(true)}
              aria-label='Ошибка в описании'
            >
              <FlagIcon className='size-5' />
            </Button>
          </StickyFooter>
        ) : (
          <HoldControls
            key={side}
            holdSeconds={stretch.holdSeconds}
            side={stretch.perSide ? side : undefined}
            back={{ label: 'Сбросить', icon: RotateCcwIcon, onClick: () => setSide(0) }}
            next={
              stretch.perSide && side === 1
                ? { label: 'Сторона', icon: SkipForwardIcon, onClick: () => setSide(2) }
                : { label: 'Готово', icon: CheckIcon, onClick: () => setSide(0) }
            }
          />
        )
      }
      className='gap-7'
    >
      <Rise className='flex flex-col gap-4 px-gutter'>
        <CatalogImage
          src={stretch.imageUrl}
          alt={stretch.name}
          size='cover'
        />
        <Poster
          as='h1'
          size='2xl'
          className='hyphens-auto'
        >
          {stretch.name}
        </Poster>
      </Rise>

      <Rise className='px-gutter'>
        <StatGrid
          items={[
            { label: 'удержание, с', value: stretch.holdSeconds },
            { label: 'стороны', value: stretch.perSide ? '× 2' : '—' },
            { label: 'всего, с', value: stretch.holdSeconds * (stretch.perSide ? 2 : 1) },
          ]}
        />
      </Rise>

      {stretch.howTo && (
        <ScreenSection title='Как делать'>
          <Text
            size='lg'
            className='leading-relaxed'
          >
            {stretch.howTo}
          </Text>
          {stretch.perSide && (
            <Text
              size='sm'
              tone='muted'
            >
              На каждую сторону — время удваивается.
            </Text>
          )}
        </ScreenSection>
      )}

      <ComplaintSheet
        open={complaintOpen}
        onOpenChange={setComplaintOpen}
        onSubmit={() => Promise.resolve()}
        subject={stretch.name}
      />
    </Screen>
  )
}

export default StretchScreen
