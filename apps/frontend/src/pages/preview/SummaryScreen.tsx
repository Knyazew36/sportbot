import { ArrowRightIcon, CheckIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { MedalArt } from '@/shared/ui/kit/Art'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'

import { summary } from './model/mock'

// Итог тренировки: финишный плакат — время, подходы, серия, кнопка «Заминка» (frontend-tz, 8.6)
const SummaryScreen = () => (
  <Screen
    header={
      <ScreenHeader
        title='Финиш · 13 октября'
        aside='Грудь и трицепс'
      />
    }
    footer={
      <StickyFooter>
        <Lead
          size='sm'
          tone='soft'
          className='mb-3 text-center'
        >
          шесть минут растяжки — и домой
        </Lead>
        <ButtonLink
          to={ROUTES.PREVIEW_COOLDOWN}
          size='xl'
          className='w-full justify-between'
        >
          Заминка
          <ArrowRightIcon
            className='size-7'
            strokeWidth={2.5}
          />
        </ButtonLink>
      </StickyFooter>
    }
  >
    <Rise className='relative overflow-hidden px-gutter'>
      <div className='sb-halftone absolute -top-10 -left-16 size-64 rounded-full opacity-20' />
      <Lead className='relative'>тренировка</Lead>
      <Poster
        as='h1'
        size='display'
        tone='primary'
        className='relative'
      >
        засчи­тана
      </Poster>
      <div className='relative mt-2 flex items-end justify-between gap-4'>
        <div>
          <Eyebrow as='p'>Время</Eyebrow>
          <Poster
            size='5xl'
            numeric
            className='mt-1'
          >
            {summary.time}
          </Poster>
        </div>
        <div className='relative w-[min(118px,30vw)] shrink-0'>
          <MedalArt />
          <Poster
            as='span'
            size='2xl'
            tone='primary'
            className='absolute inset-x-0 top-[50%] text-center'
          >
            {summary.streak}
          </Poster>
        </div>
      </div>
    </Rise>

    <Rise className='px-gutter'>
      <StatGrid
        framed
        items={[
          { label: 'подходов', value: summary.sets },
          { label: 'упражнений', value: `${summary.exercises.done}/${summary.exercises.total}` },
          { label: 'серия', value: `${summary.streak} дн` },
        ]}
      />
    </Rise>

    <ScreenSection title='Протокол'>
      <List>
        {summary.log.map(b => (
          <ListRow
            key={b.name}
            lead={
              <CheckIcon
                className='size-4'
                strokeWidth={2.5}
              />
            }
            title={b.name}
          >
            <Poster
              size='xs'
              tone='soft'
              className='mt-1 tracking-[0.01em]'
            >
              {b.sets}
            </Poster>
          </ListRow>
        ))}
      </List>
    </ScreenSection>
  </Screen>
)

export default SummaryScreen
