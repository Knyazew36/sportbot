import { usePrograms } from '@/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'

import { MyPrograms } from './components/MyPrograms'

// Все свои программы: на главной программ только первые несколько, здесь — целиком, активная первой
const MyProgramsPage = () => {
  const programs = usePrograms()

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title='Мои программы'
          subtitle={programs.data ? pluralize(programs.data.length, ['программа', 'программы', 'программ']) : undefined}
        />
      }
    >
      <QueryScreen
        query={programs}
        isEmpty={list => list.length === 0}
        empty={{ title: 'Программ пока нет', description: 'Подбери готовую в каталоге или собери свою.' }}
      >
        {list => (
          <MyPrograms
            programs={[...list].sort((a, b) => Number(b.active) - Number(a.active))}
            deletable
          />
        )}
      </QueryScreen>
    </Screen>
  )
}

export default MyProgramsPage
