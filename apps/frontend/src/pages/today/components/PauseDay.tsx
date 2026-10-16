import type { DayToday } from '@/entities/day'
import { useEndPause } from '@/entities/pause'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Пауза: бот молчит, серия заморожена. Срок вышел — вопрос «Возвращаемся?» (business-tz, 8.5)
export const PauseDay = ({ pause }: { pause: NonNullable<DayToday['pause']> }) => {
  const end = useEndPause()

  if (pause.expired) {
    return (
      <>
        <Rise className='px-gutter'>
          <Eyebrow as='p'>Пауза закончилась</Eyebrow>
          <Poster
            as='h1'
            size='display'
            tone='primary'
            className='mt-4'
          >
            Возвра&shy;щаемся?
          </Poster>
        </Rise>
        <Rise className='grid grid-cols-2 gap-2 px-gutter'>
          <Button
            disabled={end.isPending}
            onClick={() => end.mutate()}
          >
            Да
          </Button>
          <ButtonLink
            to={buildPath(ROUTES.ME_SECTION, { section: 'training' })}
            variant='outline'
          >
            Продлить
          </ButtonLink>
        </Rise>
      </>
    )
  }

  return (
    <>
      <Rise className='px-gutter'>
        <Eyebrow as='p'>Бот молчит, серия сохранена</Eyebrow>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          className='mt-4'
        >
          на
          <br />
          паузе
        </Poster>
        <Lead
          size='xl'
          className='mt-3'
        >
          {pause.endDate ? `до ${formatDate(pause.endDate, 'd MMMM')}` : 'до отмены'}
        </Lead>
      </Rise>
      <Rise className='hatch border-border mx-gutter h-28 border-[1.5px] opacity-60' />
      <Rise className='px-gutter'>
        <Button
          className='w-full'
          disabled={end.isPending}
          onClick={() => end.mutate()}
        >
          Снять паузу
        </Button>
      </Rise>
    </>
  )
}
