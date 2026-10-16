import { RepeatIcon, TriangleAlertIcon } from 'lucide-react'
import { useNavigate } from 'react-router'

import { useState } from 'react'

import { muscleNames } from '@/entities/catalog/lib'
import { EQUIPMENT_LABEL, type ExerciseDto } from '@/entities/catalog/types'
import { ROUTES } from '@/shared/config/paths'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { ScreenState } from '@/shared/ui/kit/ScreenState'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import { exercises } from './model/catalog'
import { profile } from './model/mock'

// Заменяем текущее упражнение тренировки — «Жим гантелей на наклонной скамье»
const current = exercises.find(e => e.id === 2)!
const limitedZones = new Set(profile.limits.map(l => l.zone))

// Аналоги — с теми же основными мышцами (business-tz, 7.4)
const analogs = exercises.filter(
  e => e.id !== current.id && e.primaryMuscles.some(m => current.primaryMuscles.some(c => c.id === m.id)),
)
const touchesLimit = (e: ExerciseDto) => e.joints.some(j => limitedZones.has(j.name))
const safe = analogs.filter(e => !touchesLimit(e))
const risky = analogs.filter(touchesLimit)

// Замена упражнения на тренировке (frontend-tz, 8.4): аналоги, затем «только сегодня» или «в комплексе»
const ReplaceExerciseScreen = () => {
  const navigate = useNavigate()
  const [showRisky, setShowRisky] = useState(false)
  const [choice, setChoice] = useState<ExerciseDto | null>(null)
  const list = showRisky ? [...safe, ...risky] : safe

  const apply = () => {
    if (!choice) return
    navigate(`${ROUTES.PREVIEW_WORKOUT}?replaced=${choice.id}`)
  }

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PREVIEW_WORKOUT}
          title='Заменить'
          subtitle={current.name}
        />
      }
    >
      <Rise className='px-gutter'>
        <Text tone='soft'>
          Аналоги на те же мышцы: <span className='text-foreground'>{muscleNames(current.primaryMuscles)}</span>. План
          подходов и повторов перейдёт с заменяемого, история весов у аналога своя.
        </Text>
      </Rise>

      {limitedZones.size > 0 && (
        <Rise className='px-gutter'>
          <Text
            size='sm'
            tone='danger'
            className='flex items-center gap-2'
          >
            <TriangleAlertIcon className='size-4 shrink-0' />
            Без упражнений на зону с ограничением: {[...limitedZones].join(', ').toLowerCase()}
          </Text>
        </Rise>
      )}

      <ScreenSection
        title='Аналоги'
        aside={`${list.length} из ${analogs.length}`}
      >
        {list.length === 0 ? (
          <ScreenState
            state='empty'
            title='Подходящих аналогов нет'
            description={`Все упражнения на ${muscleNames(current.primaryMuscles).toLowerCase()} нагружают сустав с ограничением.`}
            action={
              risky.length > 0 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowRisky(true)}
                >
                  Показать всё равно · {risky.length}
                </Button>
              )
            }
          />
        ) : (
          <List>
            {list.map(e => (
              <CatalogRow
                key={e.id}
                name={e.name}
                imageUrl={e.imageUrl}
                meta={[muscleNames(e.primaryMuscles), e.equipment && EQUIPMENT_LABEL[e.equipment]]
                  .filter(Boolean)
                  .join(' · ')}
                trail={
                  <Button
                    variant='outline'
                    size='icon-sm'
                    onClick={() => setChoice(e)}
                    aria-label={`Заменить на «${e.name}»`}
                  >
                    <RepeatIcon />
                  </Button>
                }
              >
                {touchesLimit(e) && (
                  <Badge
                    variant='destructive'
                    className='mt-2'
                  >
                    <TriangleAlertIcon />
                    нагружает{' '}
                    {e.joints
                      .filter(j => limitedZones.has(j.name))
                      .map(j => j.name.toLowerCase())
                      .join(', ')}
                  </Badge>
                )}
              </CatalogRow>
            ))}
          </List>
        )}
      </ScreenSection>

      <Sheet
        open={choice != null}
        onOpenChange={open => !open && setChoice(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Заменить на «{choice?.name}»</SheetTitle>
            <SheetDescription>Насовсем — в комплексе «Грудь и трицепс» вместо «{current.name}».</SheetDescription>
          </SheetHeader>
          <div className='flex flex-col gap-3 px-gutter pb-6'>
            <Button
              size='lg'
              className='w-full'
              onClick={apply}
            >
              Только сегодня
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='w-full'
              onClick={apply}
            >
              Заменить в комплексе
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </Screen>
  )
}

export default ReplaceExerciseScreen
