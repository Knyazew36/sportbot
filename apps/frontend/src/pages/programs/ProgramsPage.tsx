import { PlusIcon } from 'lucide-react'

import { useState } from 'react'

import { usePrograms } from '@sportbot/api/entities/program'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Lead } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { ActiveProgram } from './components/ActiveProgram'
import { CatalogPicks } from './components/CatalogPicks'
import { MyPrograms } from '@/widgets/my-programs/MyPrograms'
import { NewProgramSheet } from './components/NewProgramSheet'
import { SourceUpdate } from './components/SourceUpdate'

/** Сколько своих программ под плакатом; остальные — на странице «Все мои программы» */
const MY_PROGRAMS_SHOWN = 4

// Программы пользователя (frontend-tz, 10.1): плакат активной, под ним первые свои программы и ссылка
// на все, ниже лента каталога. Своих программ нет — лента и есть главное на экране
const ProgramsPage = () => {
  const programs = usePrograms()
  const [newOpen, setNewOpen] = useState(false)

  return (
    <Screen
      header={
        <ScreenHeader title='Программы' />
      }
      footer={
        <StickyFooter>
          <Button
            size='lg'
            onClick={() => setNewOpen(true)}
          >
            Новая программа
            <PlusIcon
              className='size-7'
              strokeWidth={2.5}
            />
          </Button>
        </StickyFooter>
      }
    >
      <QueryScreen query={programs}>
        {list => {
          if (!list.length)
            return (
              <>
                <Rise className='px-gutter'>
                  <Lead>Программ пока нет. Подбери готовую под себя или собери свою с нуля.</Lead>
                </Rise>
                <CatalogPicks title='Подобрать программу' />
              </>
            )
          const active = list.find(p => p.active)
          return (
            <>
              {active && <ActiveProgram programId={active.id} />}

              {list
                .filter(p => p.sourceUpdated)
                .map(p => (
                  <SourceUpdate
                    key={p.id}
                    program={p}
                  />
                ))}

              {/* Активная уже плакатом выше — в коротком списке только остальные */}
              <MyPrograms
                programs={list.filter(p => !p.active)}
                title='Мои программы'
                limit={MY_PROGRAMS_SHOWN}
              />

              <CatalogPicks title='Другие программы' />
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
