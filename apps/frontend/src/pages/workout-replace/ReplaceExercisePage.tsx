import { PlusIcon, RepeatIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { useAnalogs, useCurrentWorkout, useReplaceItem, type WorkoutAnalog } from '@sportbot/api/entities/workout'
import { ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Lead, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet'
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet'

import { AnalogList } from './components/AnalogList'
import { type ReplaceChoice, ReplaceChoiceSheet } from './components/ReplaceChoiceSheet'

// Замена упражнения (business-tz, 7.4): аналоги с теми же основными мышцами, без зон с ограничением,
// затем «только сегодня» или «в комплексе». История весов у аналога своя
const ReplaceExercisePage = () => {
  const itemId = Number(useParams().itemId)
  const navigate = useNavigate()
  const current = useCurrentWorkout()
  const analogs = useAnalogs(itemId)
  const replace = useReplaceItem()
  // draft — своё упражнение, которое только что ушло на модерацию из шторки создания
  const [choice, setChoice] = useState<ReplaceChoice | null>(null)
  // Тап по строке — посмотреть упражнение; кнопка справа — сразу к выбору замены
  const [preview, setPreview] = useState<WorkoutAnalog | null>(null)
  // Своё упражнение создаётся шторкой прямо здесь и сразу открывает выбор замены
  const [createOpen, setCreateOpen] = useState(false)

  const workout = current.data?.workout
  const item = workout?.exercises.find(e => e.id === itemId)

  const apply = (inComplex: boolean) =>
    choice &&
    replace
      .mutateAsync({ itemId, exerciseId: choice.id, inComplex })
      .then(() => navigate(ROUTES.WORKOUT, { replace: true }))

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.WORKOUT}
          title='Замена'
          subtitle={item?.name}
        />
      }
      className='px-gutter'
    >
      <Rise>
        <Lead>те же мышцы{item?.limitedZones.length ? ', без зон с ограничением' : ''} —</Lead>
        <Text
          tone='soft'
          className='mt-2'
        >
          Подходы этого упражнения на сегодня удалятся: у аналога своя история весов.
        </Text>
      </Rise>

      <ScreenSection
        title='Аналоги'
        aside={analogs.data ? `${analogs.data.length}` : undefined}
      >
        <QueryScreen
          query={analogs}
          className=''
          isEmpty={list => list.length === 0}
          empty={{
            title: 'Подходящих аналогов нет',
            description: 'Все упражнения на эти мышцы уже в тренировке или нагружают сустав с ограничением.',
            action: (
              <Button
                variant='outline'
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon />
                Создать своё упражнение
              </Button>
            ),
          }}
        >
          {list => (
            <AnalogList
              list={list}
              onPreview={setPreview}
              onChoose={setChoice}
            />
          )}
        </QueryScreen>
        {!!analogs.data?.length && (
          <Button
            variant='outline'
            className='w-full'
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon />
            Нет нужного — создать своё
          </Button>
        )}
      </ScreenSection>

      <ExerciseSheet
        exercise={preview}
        onOpenChange={open => !open && setPreview(null)}
        action={
          <Button
            size='lg'
            className='w-full'
            onClick={() => {
              setChoice(preview)
              setPreview(null)
            }}
          >
            <RepeatIcon className='size-5' />
            Заменить на это
          </Button>
        }
      />

      <ReplaceChoiceSheet
        choice={choice}
        onClose={() => setChoice(null)}
        itemName={item?.name}
        complexName={workout?.complexName}
        canReplaceInComplex={!!workout?.complexId}
        pending={replace.isPending}
        onApply={inComplex => void apply(inComplex)}
      />

      <ExerciseCreateSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setChoice}
      />
    </Screen>
  )
}

export default ReplaceExercisePage
