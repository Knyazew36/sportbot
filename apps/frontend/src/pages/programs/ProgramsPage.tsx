import { PlusIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useState } from 'react'

import { useActivateProgram, usePrograms } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { pluralize } from '@/shared/lib/format'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'

import { ActiveProgram } from './components/ActiveProgram'
import { FriendUpdate } from './components/FriendUpdate'
import { NewProgramSheet } from './components/NewProgramSheet'

const PROGRAM_FORMS: [string, string, string] = ['программа', 'программы', 'программ']
const COMPLEX_FORMS: [string, string, string] = ['комплекс', 'комплекса', 'комплексов']

// Программы пользователя (frontend-tz, 10.1): активная — плакатом, остальные списком, переключение одним нажатием
const ProgramsPage = () => {
  const programs = usePrograms()
  const activate = useActivateProgram()
  const [newOpen, setNewOpen] = useState(false)

  return (
    <Screen
      header={
        <ScreenHeader
          title='Программы'
          aside={programs.data ? pluralize(programs.data.length, PROGRAM_FORMS) : undefined}
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
      <QueryScreen
        query={programs}
        isEmpty={list => list.length === 0}
        empty={{
          title: 'Программ пока нет',
          description: 'Возьми готовый шаблон или собери свою с нуля.',
        }}
      >
        {list => {
          const active = list.find(p => p.active)
          const rest = list.filter(p => !p.active)
          return (
            <>
              {active && <ActiveProgram programId={active.id} />}

              {list
                .filter(p => p.sourceUpdated)
                .map(p => (
                  <FriendUpdate
                    key={p.id}
                    program={p}
                  />
                ))}

              {rest.length > 0 && (
                <ScreenSection
                  title={active ? 'Остальные' : 'Твои программы'}
                  aside='активная — одна'
                >
                  <List>
                    {rest.map(p => (
                      <ListRow
                        key={p.id}
                        lead={String(p.complexCount).padStart(2, '0')}
                        title={
                          <Link
                            to={buildPath(ROUTES.PROGRAM, { programId: p.id })}
                            className='underline-offset-4 hover:underline'
                          >
                            {p.name}
                          </Link>
                        }
                        meta={pluralize(p.complexCount, COMPLEX_FORMS)}
                        trail={
                          <Button
                            variant='outline'
                            size='xs'
                            disabled={activate.isPending}
                            onClick={() => activate.mutate(p.id)}
                          >
                            Сделать активной
                          </Button>
                        }
                      >
                        {p.fromFriend && (
                          <Badge
                            variant='secondary'
                            className='mt-2'
                          >
                            от {p.fromFriend}
                          </Badge>
                        )}
                      </ListRow>
                    ))}
                  </List>
                </ScreenSection>
              )}
            </>
          )
        }}
      </QueryScreen>

      <NewProgramSheet
        open={newOpen}
        onOpenChange={setNewOpen}
      />
    </Screen>
  )
}

export default ProgramsPage
