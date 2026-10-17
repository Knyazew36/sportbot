import { ArrowRightIcon, LayoutTemplateIcon, PencilIcon, PlusIcon, RefreshCwIcon, SparklesIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useState } from 'react'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Ticket } from '@/shared/ui/kit/Ticket'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

import { type Program, programs } from './model/mock'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { EXERCISE_FORMS } from '@/shared/lib/plural-forms'

const editPath = (id: number | string) => buildPath(ROUTES.PREVIEW_PROGRAM, { programId: id })

const countExercises = (p: Program) => p.complexes.reduce((sum, c) => sum + c.exercises.length, 0)

// Активная программа — плакат: название, ротация билетами, сводка и правка
const ActiveProgram = ({ program }: { program: Program }) => (
  <>
    <Rise className='px-gutter'>
      <Eyebrow as='p'>Активная программа</Eyebrow>
      <Poster
        as='h1'
        size='3xl'
        tone='primary'
        className='mt-3 hyphens-auto'
      >
        {program.title}
      </Poster>
    </Rise>
    <ScreenSection
      title='Очередь комплексов'
      aside='следующий подсвечен'
      bleed
    >
      <ol className='no-scrollbar flex gap-2 overflow-x-auto px-gutter'>
        {program.complexes.map(c => (
          <li key={c.id}>
            <Ticket
              mark={c.letter}
              title={c.title}
              active={c.id === program.nextComplexId}
            >
              <Eyebrow>{pluralize(c.exercises.length, EXERCISE_FORMS)}</Eyebrow>
            </Ticket>
          </li>
        ))}
      </ol>
    </ScreenSection>
    <Rise className='flex flex-col gap-4 px-gutter'>
      <StatGrid
        items={[
          { label: 'комплекса', value: program.complexes.length },
          { label: pluralize(countExercises(program), EXERCISE_FORMS, { withCount: false }), value: countExercises(program) },
          { label: 'в неделю', value: 3 },
        ]}
      />
      <ButtonLink
        to={editPath(program.id)}
        variant='outline'
        className='w-full'
      >
        <PencilIcon />
        Редактировать
      </ButtonLink>
    </Rise>
  </>
)

// Друг поменял исходную программу: обновление перезапишет свои правки, история останется (frontend-tz, 10.4)
const FriendUpdate = ({ program }: { program: Program }) => (
  <Rise className='px-gutter'>
    <div className='border-primary bg-accent flex flex-col gap-3 border-[1.5px] p-4'>
      <Eyebrow
        as='p'
        tone='primary'
        className='flex items-center gap-2'
      >
        <SparklesIcon className='size-3.5' />
        {program.from?.name} обновил программу
      </Eyebrow>
      <Text>«{program.title}» у друга изменилась. Можно забрать новую версию себе.</Text>
      <ConfirmAction
        trigger={
          <Button
            variant='alert'
            size='sm'
            className='self-start'
          />
        }
        title='Обновить у себя?'
        description='Твои правки в этой копии пропадут. История тренировок и весов сохранится.'
        confirmLabel='Обновить'
        onConfirm={() => undefined}
      >
        <RefreshCwIcon />
        Обновить у себя
      </ConfirmAction>
    </div>
  </Rise>
)

// «Новая программа»: из шаблона или с нуля (frontend-tz, 10.1)
const NewProgramSheet = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
  <Sheet
    open={open}
    onOpenChange={onOpenChange}
  >
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Новая программа</SheetTitle>
        <SheetDescription>Возьми готовый шаблон и поправь под себя или собери с чистого листа.</SheetDescription>
      </SheetHeader>
      <div className='flex flex-col gap-3 px-gutter pt-2 pb-6'>
        <ButtonLink
          to={ROUTES.PREVIEW_PROGRAM_TEMPLATES}
          size='lg'
          className='w-full justify-between'
        >
          Из шаблона
          <LayoutTemplateIcon className='size-6' />
        </ButtonLink>
        <ButtonLink
          to={editPath('new')}
          variant='outline'
          size='lg'
          className='w-full justify-between'
        >
          С нуля
          <ArrowRightIcon className='size-6' />
        </ButtonLink>
      </div>
    </SheetContent>
  </Sheet>
)

const ProgramsScreen = () => {
  const [activeId, setActiveId] = useState(programs.find(p => p.active)?.id ?? programs[0]!.id)
  const [newOpen, setNewOpen] = useState(false)
  const active = programs.find(p => p.id === activeId)!
  const rest = programs.filter(p => p.id !== activeId)
  const updated = programs.filter(p => p.from?.updated)

  return (
    <Screen
      key={activeId}
      header={
        <ScreenHeader
          title='Программы'
          aside={`${programs.length} программы`}
        />
      }
      footer={
        <StickyFooter>
          <Button
            size='lg'
            className='w-full justify-between'
            onClick={() => setNewOpen(true)}
          >
            Новая программа
            <PlusIcon
              className='size-6'
              strokeWidth={2.5}
            />
          </Button>
        </StickyFooter>
      }
    >
      <ActiveProgram program={active} />

      {updated.map(p => (
        <FriendUpdate
          key={p.id}
          program={p}
        />
      ))}

      <ScreenSection
        title='Остальные'
        aside='активная — одна'
      >
        <List>
          {rest.map(p => (
            <ListRow
              key={p.id}
              lead={String(p.complexes.length).padStart(2, '0')}
              title={
                <Link
                  to={editPath(p.id)}
                  className='underline-offset-4 hover:underline'
                >
                  {p.title}
                </Link>
              }
              meta={p.complexes.map(c => c.title).join(' · ')}
              trail={
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => setActiveId(p.id)}
                >
                  Сделать активной
                </Button>
              }
            >
              {p.from && (
                <Badge
                  variant='secondary'
                  className='mt-2'
                >
                  от {p.from.name}
                </Badge>
              )}
            </ListRow>
          ))}
        </List>
      </ScreenSection>

      <NewProgramSheet
        open={newOpen}
        onOpenChange={setNewOpen}
      />
    </Screen>
  )
}

export default ProgramsScreen
