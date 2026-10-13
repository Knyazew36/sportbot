import { ListIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react'

import { useState } from 'react'

import { muscleNames, splitSteps } from '@/entities/catalog/lib'
import type { StretchDto } from '@/entities/catalog/types'
import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { StepList } from '@/shared/ui/kit/StepList'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'
import { HoldControls } from '@/widgets/catalog/HoldControls'

import { stretches } from './model/catalog'

// Заминка после «Грудь и трицепс»: растяжки справочника на отработавшие мышцы.
// Основной блок обязателен, «если есть время» — по желанию (frontend-tz, раздел 9)
const pick = (id: number) => stretches.find(s => s.id === id)!
const main = [pick(3), pick(1)]
const extra = [pick(4)]
const all = [...main, ...extra]

const secondsOf = (s: StretchDto) => s.holdSeconds * (s.perSide ? 2 : 1)
const totalMin = Math.ceil(all.reduce((sum, s) => sum + secondsOf(s), 0) / 60)

const BLOCKS = [
  { title: 'Основной блок', list: main, offset: 0 },
  { title: 'Если есть время', list: extra, offset: main.length },
]

// Режим «Список» (frontend-tz, 9.2): вся заминка разом в шторке, с переходом к любой растяжке
const StretchSheet = ({
  open,
  onOpenChange,
  current,
  onPick,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  current: number
  onPick: (index: number) => void
}) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent side='bottom'>
      <SheetHeader>
        <SheetTitle>Вся заминка</SheetTitle>
        <Eyebrow tone='primary'>~{totalMin} мин</Eyebrow>
      </SheetHeader>
      <div className='flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-5'>
        {BLOCKS.map(block => (
          <div key={block.title}>
            <Eyebrow
              as='p'
              className='mb-2'
            >
              {block.title}
            </Eyebrow>
            <List>
              {block.list.map((s, i) => {
                const index = block.offset + i
                return (
                  <CatalogRow
                    key={s.id}
                    name={s.name}
                    imageUrl={s.imageUrl}
                    meta={`${muscleNames(s.muscles)} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                    selected={index === current}
                    trail={
                      <Button
                        variant={index === current ? 'default' : 'outline'}
                        size='xs'
                        onClick={() => {
                          onPick(index)
                          onOpenChange(false)
                        }}
                      >
                        {index === current ? 'Сейчас' : 'Перейти'}
                      </Button>
                    }
                  />
                )
              })}
            </List>
          </div>
        ))}
      </div>
    </SheetContent>
  </Sheet>
)

// Заминка, пошаговый режим: одна растяжка на экране — картинка, как делать, таймер удержания (frontend-tz, 9.1)
const CooldownScreen = () => {
  const [index, setIndex] = useState(0)
  const [side, setSide] = useState<1 | 2>(1)
  const [listOpen, setListOpen] = useState(false)
  const [finished, setFinished] = useState(false)
  const stretch = all[index]!
  const inMain = index < main.length

  const go = (next: number) => {
    setIndex(next)
    setSide(1)
  }
  const next = () => {
    if (stretch.perSide && side === 1) setSide(2)
    else if (index < all.length - 1) go(index + 1)
    else setFinished(true)
  }
  const back = () => {
    if (side === 2) setSide(1)
    else if (index > 0) go(index - 1)
  }

  if (finished) {
    return (
      <Screen
        header={
          <TopBar
            back={ROUTES.PREVIEW_SUMMARY}
            title='Заминка'
            subtitle='готово'
          />
        }
        footer={
          <StickyFooter>
            <ButtonLink
              to={ROUTES.PREVIEW_TODAY}
              size='xl'
              className='w-full'
            >
              На «Сегодня»
            </ButtonLink>
          </StickyFooter>
        }
        className='px-5'
      >
        <Rise className='flex flex-1 flex-col justify-center'>
          <Lead>растянулись —</Lead>
          <Poster
            as='h1'
            size='display'
            tone='primary'
            className='mt-1'
          >
            Готово
          </Poster>
          <div className='sb-lanes mt-6 h-20 opacity-30' />
        </Rise>
      </Screen>
    )
  }

  return (
    <div className='flex min-h-svh flex-1 flex-col'>
      <Screen
        key={index}
        header={
          <>
            <TopBar
              back={ROUTES.PREVIEW_SUMMARY}
              title='Заминка'
              subtitle={`растяжка ${index + 1} из ${all.length} · ~${totalMin} мин`}
              action={
                <Button
                  variant='alert'
                  size='icon'
                  onClick={() => setListOpen(true)}
                  aria-label='Весь список'
                >
                  <ListIcon className='size-5' />
                </Button>
              }
            />
            {/* Сегменты: пройденные и текущий залиты, «если есть время» — пунктиром */}
            <div className='flex gap-1 px-5 pt-3'>
              {all.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    'h-1 flex-1',
                    i <= index
                      ? 'bg-primary'
                      : i < main.length
                        ? 'bg-border'
                        : 'border-border border-t-2 border-dashed',
                  )}
                />
              ))}
            </div>
          </>
        }
        className='gap-5 px-5 pt-4'
      >
        {/* Картинка из справочника — та же, что в карточке растяжки; на низких экранах уступает место описанию */}
        <Rise className='relative [@media(max-height:620px)]:hidden'>
          <CatalogImage
            src={stretch.imageUrl}
            alt={stretch.name}
            size='cover'
            className='aspect-[16/10] max-h-[30svh]'
          />
          {stretch.perSide && <Badge className='absolute right-2 bottom-2'>сторона {side} из 2</Badge>}
        </Rise>

        <Rise>
          <Eyebrow
            as='p'
            tone='primary'
          >
            {inMain ? 'Основной блок' : 'Если есть время'} · {muscleNames(stretch.muscles)}
          </Eyebrow>
          <Poster
            as='h1'
            size='2xl'
            className='mt-2 hyphens-auto'
          >
            {stretch.name}
          </Poster>
        </Rise>

        {/* Описание — главное на экране после названия: крупно и сразу под ним, без прокрутки */}
        <Rise>
          <StepList
            items={splitSteps(stretch.howTo)}
            size='lg'
          />
        </Rise>
      </Screen>

      <HoldControls
        key={`${index}-${side}`}
        holdSeconds={stretch.holdSeconds}
        side={stretch.perSide ? side : undefined}
        back={{ label: 'Назад', icon: SkipBackIcon, onClick: back }}
        next={{
          label: stretch.perSide && side === 1 ? 'Сторона' : index === all.length - 1 ? 'Готово' : 'Дальше',
          icon: SkipForwardIcon,
          onClick: next,
        }}
      />

      <StretchSheet
        open={listOpen}
        onOpenChange={setListOpen}
        current={index}
        onPick={go}
      />
    </div>
  )
}

export default CooldownScreen
