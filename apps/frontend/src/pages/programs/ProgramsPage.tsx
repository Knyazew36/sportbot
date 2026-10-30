import { usePrograms } from '@sportbot/api/entities/program'
import { BlankProgramButton } from '@/features/create-program/BlankProgramButton'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Lead } from '@/shared/ui/kit/Typography'

import { ActiveProgram } from './components/ActiveProgram'
import { CatalogPicks } from './components/CatalogPicks'
import { SourceUpdate } from './components/SourceUpdate'
import { SwitchProgram } from './components/SwitchProgram'

// Программы пользователя (frontend-tz, 10.1): плакат активной, под ним три пути к другой программе.
// Своих программ нет — главное на экране лента каталога и сборка с нуля
const ProgramsPage = () => {
  const programs = usePrograms()

  return (
    <Screen
      header={
        <ScreenHeader title='Программы' />
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
                <Rise className='px-gutter flex flex-col'>
                  <BlankProgramButton />
                </Rise>
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

              <SwitchProgram
                otherCount={list.filter(p => !p.active).length}
                hasActive={!!active}
              />
            </>
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default ProgramsPage
