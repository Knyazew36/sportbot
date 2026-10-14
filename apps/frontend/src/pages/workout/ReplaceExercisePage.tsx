import { RepeatIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { useAnalogs, useCurrentWorkout, useReplaceItem, type WorkoutAnalog } from '@/entities/workout'
import { toAssetUrl } from '@/shared/api'
import { ROUTES } from '@/shared/config/paths'
import { List } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Lead, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

// Замена упражнения (business-tz, 7.4): аналоги с теми же основными мышцами, без зон с ограничением,
// затем «только сегодня» или «в комплексе». История весов у аналога своя
const ReplaceExercisePage = () => {
  const itemId = Number(useParams().itemId)
  const navigate = useNavigate()
  const current = useCurrentWorkout()
  const analogs = useAnalogs(itemId)
  const replace = useReplaceItem()
  const [choice, setChoice] = useState<WorkoutAnalog | null>(null)

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
          }}
        >
          {list => (
            <List>
              {list.map(analog => (
                <CatalogRow
                  key={analog.id}
                  name={analog.name}
                  imageUrl={toAssetUrl(analog.imageUrl) ?? null}
                  meta={analog.muscles}
                  draft={analog.draft}
                  trail={
                    <Button
                      variant='outline'
                      size='icon-sm'
                      onClick={() => setChoice(analog)}
                      aria-label={`Заменить на «${analog.name}»`}
                    >
                      <RepeatIcon />
                    </Button>
                  }
                />
              ))}
            </List>
          )}
        </QueryScreen>
      </ScreenSection>

      <Sheet
        open={choice != null}
        onOpenChange={open => !open && setChoice(null)}
      >
        <SheetContent side='bottom'>
          <SheetHeader>
            <SheetTitle>Заменить на «{choice?.name}»</SheetTitle>
            <SheetDescription>
              Только на эту тренировку или насовсем — в комплексе «{workout?.complexName}» вместо «{item?.name}».
            </SheetDescription>
          </SheetHeader>
          <div className='flex flex-col gap-3 px-gutter pb-6'>
            <Button
              size='lg'
              className='w-full'
              disabled={replace.isPending}
              onClick={() => void apply(false)}
            >
              Только сегодня
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='w-full'
              disabled={replace.isPending || !workout?.complexId}
              onClick={() => void apply(true)}
            >
              Заменить в комплексе
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Screen>
  )
}

export default ReplaceExercisePage
