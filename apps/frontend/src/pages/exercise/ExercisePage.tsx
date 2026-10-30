import { PencilLineIcon, PlusIcon } from 'lucide-react'
import { useParams } from 'react-router'

import { useState } from 'react'

import { EQUIPMENT_LABEL, exerciseGuide, useCatalogExercise } from '@sportbot/api/entities/catalog'
import { complexLetter, useActiveProgram, useAddComplexExercises } from '@sportbot/api/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { AddToComplexSheet } from '@/widgets/catalog/AddToComplexSheet'
import { ExerciseEditSheet } from '@/widgets/catalog/ExerciseEditSheet'
import { CatalogGuide } from '@/widgets/catalog-guide/CatalogGuide'

import { ExerciseHero } from './components/ExerciseHero'
import { ExerciseMuscles } from './components/ExerciseMuscles'
import { OverlaySheet } from './components/OverlaySheet'
import { OwnVideoSection } from './components/OwnVideoSection'

// Карточка упражнения (frontend-tz, 11.2)
const ExercisePage = () => {
  const exerciseId = Number(useParams().exerciseId)
  const exercise = useCatalogExercise(exerciseId)
  const program = useActiveProgram()
  const add = useAddComplexExercises()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.LIBRARY}
          title={exercise.data?.name ?? 'Упражнение'}
          subtitle={exercise.data?.equipment ? EQUIPMENT_LABEL[exercise.data.equipment] : undefined}
        />
      }
      footer={
        exercise.data && (
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
              disabled={!program.data}
              onClick={() => setAddOpen(true)}
            >
              <PlusIcon
                className='size-6'
                strokeWidth={2.5}
              />
              {program.data ? 'В тренировку' : 'Нет активной программы'}
            </Button>
          </StickyFooter>
        )
      }
      className='gap-7'
    >
      <QueryScreen query={exercise}>
        {e => (
            <>
              <ExerciseHero exercise={e} />
              <ExerciseMuscles exercise={e} />
              <CatalogGuide
                guide={exerciseGuide(e)}
                title='Техника'
              />
              <OwnVideoSection onOpen={() => setOverlayOpen(true)} />

              {program.data && (
                <AddToComplexSheet
                  open={addOpen}
                  onOpenChange={setAddOpen}
                  program={program.data.name}
                  complexes={program.data.complexes.map((c, i) => ({
                    id: c.id,
                    letter: complexLetter(i),
                    title: c.name,
                    count: c.exercises.length,
                  }))}
                  onPick={complexId => add.mutateAsync({ complexId, exerciseIds: [e.id] })}
                />
              )}
              <OverlaySheet
                open={overlayOpen}
                onOpenChange={setOverlayOpen}
                exercise={e}
                program={program.data ?? undefined}
              />
              <ExerciseEditSheet
                open={editOpen}
                onOpenChange={setEditOpen}
                exercise={e}
              />
            </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default ExercisePage
