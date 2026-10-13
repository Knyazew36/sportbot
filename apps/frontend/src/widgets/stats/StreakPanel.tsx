import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster, Suffix } from '@/shared/ui/kit/Typography'

// Серия и рекорд на чёрной плашке — главный мотиватор статистики
export const StreakPanel = ({ current, record }: { current: number; record: number }) => (
  <Rise className='px-5'>
    <InkPanel className='p-4'>
      <div className='flex items-end justify-between'>
        <div>
          <Eyebrow
            as='p'
            tone='inverseMuted'
          >
            Серия сейчас
          </Eyebrow>
          <Poster
            size='5xl'
            numeric
            className='mt-2'
          >
            {current}
          </Poster>
        </div>
        <div className='text-right'>
          <Eyebrow
            as='p'
            tone='inverseMuted'
          >
            Рекорд
          </Eyebrow>
          <Poster
            size='5xl'
            numeric
            tone='primary'
            className='mt-2'
          >
            {record}
          </Poster>
        </div>
      </div>
    </InkPanel>
  </Rise>
)

// Посещаемость: месяц крупно, неделя рядом
export const Attendance = ({ month, week, weekNote }: { month: number; week: number; weekNote: string }) => (
  <Rise className='px-5'>
    <Lead>посещаемость</Lead>
    <div className='mt-2 grid grid-cols-2 items-end'>
      <div>
        <Poster
          size='display'
          tone='primary'
        >
          {month}
          <Suffix>%</Suffix>
        </Poster>
        <Eyebrow
          as='p'
          className='mt-2'
        >
          за месяц
        </Eyebrow>
      </div>
      <div className='border-border border-l-[1.5px] pl-4'>
        <Poster
          size='4xl'
          className='text-[min(64px,15vw)]'
        >
          {week}
          <Suffix>%</Suffix>
        </Poster>
        <Eyebrow
          as='p'
          className='mt-2'
        >
          за неделю · {weekNote}
        </Eyebrow>
      </div>
    </div>
  </Rise>
)
