import { CheckIcon, PencilLineIcon, PlayIcon, RotateCcwIcon, SkipForwardIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useState } from 'react'

import { muscleNames, stretchGuide, useCatalogStretch } from '@/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { MistakeList } from '@/shared/ui/kit/MistakeList'
import { PhotoPair } from '@/shared/ui/kit/PhotoPair'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { StepList } from '@/shared/ui/kit/StepList'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { HoldControls } from '@/widgets/catalog/HoldControls'
import { StretchEditSheet } from '@/widgets/catalog/StretchEditSheet'
import { VideoLink } from '@/widgets/catalog/VideoLink'

const BACK = `${ROUTES.LIBRARY}?tab=stretches`

// Карточка растяжки (frontend-tz, 11.3): «Попробовать» запускает таймер удержания, как в заминке
const StretchPage = () => {
  const stretchId = Number(useParams().stretchId)
  const stretch = useCatalogStretch(stretchId)
  // 0 — таймер не запущен, 1 и 2 — сторона
  const [side, setSide] = useState<0 | 1 | 2>(0)
  const [editOpen, setEditOpen] = useState(false)
  const s = stretch.data

  return (
    <Screen
      header={
        <TopBar
          back={BACK}
          title={s?.name ?? 'Растяжка'}
          subtitle={s ? muscleNames(s.muscles) : undefined}
        />
      }
      footer={
        s &&
        (side === 0 ? (
          <StickyFooter>
            <Button
              variant='outline'
              size='icon-lg'
              className='size-[60px]'
              onClick={() => setEditOpen(true)}
              aria-label='Предложить правку'
            >
              <PencilLineIcon className='size-6' />
            </Button>
            <Button
              size='lg'
              onClick={() => setSide(1)}
            >
              <PlayIcon className='size-6' />
              Попробовать
            </Button>
          </StickyFooter>
        ) : (
          <HoldControls
            key={side}
            holdSeconds={s.holdSeconds}
            side={s.perSide ? side : undefined}
            autoStart
            back={{ label: 'Сбросить', icon: RotateCcwIcon, onClick: () => setSide(0) }}
            next={
              s.perSide && side === 1
                ? { label: 'Левая', icon: SkipForwardIcon, onClick: () => setSide(2) }
                : { label: 'Готово', icon: CheckIcon, onClick: () => setSide(0) }
            }
          />
        ))
      }
      className='gap-7'
    >
      <QueryScreen query={stretch}>
        {st => {
          const guide = stretchGuide(st)
          return (
          <>
            <Rise className='px-gutter flex flex-col gap-4'>
              <PhotoPair
                start={toAssetUrl(st.imageUrl) ?? null}
                end={toAssetUrl(st.imageEndUrl) ?? null}
                alt={st.name}
              />
              <Poster
                as='h1'
                size='2xl'
                className='hyphens-auto'
              >
                {st.name}
              </Poster>
              {st.draft && (
                <Badge
                  variant='outline'
                  className='self-start'
                >
                  не проверено
                </Badge>
              )}
              <VideoLink name={st.name} />
            </Rise>

            <Rise className='px-gutter'>
              <StatGrid
                items={[
                  { label: 'удержание, с', value: st.holdSeconds },
                  { label: 'стороны', value: st.perSide ? '× 2' : '—' },
                  { label: 'всего, с', value: st.holdSeconds * (st.perSide ? 2 : 1) },
                ]}
              />
            </Rise>

            {(guide.description || guide.steps.length > 0) && (
              <ScreenSection title='Как делать'>
                {guide.description && <Text className='leading-relaxed'>{guide.description}</Text>}
                {guide.steps.length > 0 && <StepList items={guide.steps} />}
                {st.perSide && (
                  <Text
                    size='sm'
                    tone='muted'
                  >
                    На каждую сторону — время удваивается.
                  </Text>
                )}
              </ScreenSection>
            )}

            {guide.mistakes.length > 0 && (
              <ScreenSection title='Типичные ошибки'>
                <MistakeList items={guide.mistakes} />
              </ScreenSection>
            )}

            <StretchEditSheet
              open={editOpen}
              onOpenChange={setEditOpen}
              stretch={st}
            />
          </>
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default StretchPage
