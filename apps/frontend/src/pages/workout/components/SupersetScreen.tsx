import { FlameIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type SupersetRound, supersetLabels, type WorkoutItem } from '@sportbot/api/entities/workout'
import type { EditingSet } from '@/widgets/workout/EditSetSheet'
import { haptic } from '@/shared/miniapp'
import { ChargeChain } from '@/shared/ui/kit/ChargeChain'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/shared/ui/shadcn/carousel'
import { SetList } from '@/widgets/workout/SetList'

import { ExerciseCard } from './ExerciseCard'

type SupersetScreenProps = {
  round: SupersetRound
  onEdit: (editing: EditingSet) => void
  /** Дописать забытый подход одному упражнению */
  onAddSet: (item: WorkoutItem) => void
}

// Экран суперсета: цепочка-пагинация и лента карточек участников. Свайп только смотрит —
// круг всегда начинается с первого упражнения, у которого остались подходы, и лента сама к нему едет
export const SupersetScreen = ({ round, onEdit, onAddSet }: SupersetScreenProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)
  const labels = supersetLabels(round.members)
  const startId = round.round[0]?.id

  useEffect(() => {
    if (!api) return
    const sync = () => setSelected(api.selectedScrollSnap())
    sync()
    api.on('select', sync)
    return () => {
      api.off('select', sync)
    }
  }, [api])

  // После круга и отдыха — к упражнению, с которого начнётся следующий круг
  useEffect(() => {
    const index = round.members.findIndex(e => e.id === startId)
    if (api && index >= 0) api.scrollTo(index)
  }, [api, startId, round.members])

  return (
    <>
      <Rise className='flex flex-col gap-3'>
        <div className='flex items-baseline justify-between gap-3'>
          <Poster
            as='h1'
            size='2xl'
            className='flex items-center gap-2'
          >
            <FlameIcon
              className='text-primary size-[0.9em] shrink-0'
              aria-hidden
            />
            Суперсет {round.letter}
          </Poster>
          <Eyebrow tone='primary'>
            {round.done ? 'готово' : `круг ${round.number} из ${round.rounds}`}
          </Eyebrow>
        </div>
        <Eyebrow as='p'>по кругу без отдыха · отдых после круга</Eyebrow>
        <ChargeChain
          links={round.members.map((e, i) => ({
            label: labels[i]!,
            charge: e.plannedSets ? Math.min(e.sets.length, e.plannedSets) / e.plannedSets : 0,
            state: i === selected ? 'current' : e.sets.length >= e.plannedSets ? 'done' : 'idle',
          }))}
          onPick={i => {
            haptic.select()
            api?.scrollTo(i)
          }}
        />
      </Rise>
      <Carousel
        setApi={setApi}
        className='-mx-gutter'
      >
        <CarouselContent className='px-gutter'>
          {round.members.map((e, i) => (
            <CarouselItem
              key={e.id}
              className='basis-[92%]'
            >
              <article className='border-border flex flex-col gap-5 border-[1.5px] p-4'>
                <ExerciseCard
                  item={e}
                  label={`${labels[i]} из ${round.members.length}`}
                />
                <SetList
                  item={e}
                  onEdit={onEdit}
                  onAdd={() => onAddSet(e)}
                />
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </>
  )
}
