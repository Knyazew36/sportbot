import { useProfile } from '@/entities/profile'
import { motivationFor, type WorkoutSummary } from '@/entities/workout'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster } from '@/shared/ui/kit/Typography'
import { pluralize } from '@front-cmdt/utils/pluralize'

// Шапка итога как табло финиша: вердикт с фразой, время на финише и серия.
// Время — главное число экрана: раньше его на итоге не было вовсе
export const SummaryHero = ({ summary }: { summary: WorkoutSummary }) => {
  const profile = useProfile()
  const counted = summary.status !== 'IN_PROGRESS'

  return (
    <>
      <Rise className='relative overflow-hidden px-gutter'>
        {/* Растр за вердиктом — печатный плакат, а не градиент */}
        <div className='sb-halftone pointer-events-none absolute -top-12 -right-20 size-72 rounded-full opacity-25' />
        <Lead className='relative'>тренировка</Lead>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          className='relative'
        >
          {counted ? 'засчи­тана' : 'идёт'}
        </Poster>
        {/* Фраза ждёт профиль: без пола сначала мелькнула бы нейтральная и сменилась */}
        {counted && profile.data && (
          <Lead
            size='sm'
            className='relative mt-3 max-w-[18ch]'
          >
            {motivationFor(summary.workoutId, profile.data.gender)}
          </Lead>
        )}

        {/* Финишная черта: толстая линейка, под ней время */}
        <div className='border-foreground relative mt-6 flex items-end gap-4 border-t-[3px] pt-3'>
          <div className='min-w-0'>
            {/* От «Начать» до «Завершить»: разминка, подходы и отдых вместе */}
            <Eyebrow as='p'>длительность</Eyebrow>
            <div className='mt-1 flex items-baseline gap-2'>
              <Poster
                as='span'
                size='5xl'
                numeric
              >
                {summary.minutes}
              </Poster>
              <Poster
                as='span'
                size='lg'
                tone='soft'
              >
                мин
              </Poster>
            </div>
          </div>
          {/* Дорожки уходят за край — забег окончен, разметка осталась */}
          <div
            aria-hidden
            className='sb-lanes mb-2 h-14 flex-1 opacity-20'
          />
        </div>
      </Rise>

      <Rise className='px-gutter'>
        <InkPanel className='flex items-end justify-between gap-4 px-4 py-4'>
          <Eyebrow
            as='p'
            className='text-background/60 pb-1'
          >
            серия
          </Eyebrow>
          <Poster
            size='3xl'
            numeric
          >
            {pluralize(summary.currentStreak, ['день', 'дня', 'дней'])}
          </Poster>
        </InkPanel>
      </Rise>
    </>
  )
}
