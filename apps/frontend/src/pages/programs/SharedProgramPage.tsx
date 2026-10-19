import { LinkIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useSharedProgram, useTakeSharedProgram } from '@/entities/program'
import { getApiErrorStatus } from '@/shared/api/model/api-error'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenState } from '@/shared/ui/kit/ScreenState'

import { ProgramDetails } from './components/ProgramDetails'
import { TakeFooter } from './components/TakeFooter'

// Программа по ссылке «Поделиться»: открыть и взять себе может любой пользователь бота, не только друг
const SharedProgramPage = () => {
  const token = useParams().token ?? ''
  const program = useSharedProgram(token)
  const take = useTakeSharedProgram()
  const navigate = useNavigate()

  if (getApiErrorStatus(program.error) === 404)
    return (
      <ScreenState
        state='empty'
        icon={LinkIcon}
        title='Ссылка устарела'
        description='Эту программу удалили.'
        className='mx-gutter mt-10'
      />
    )

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.PROGRAMS}
          title={program.data?.name ?? 'Программа'}
          subtitle='поделились программой'
        />
      }
      footer={
        program.data && (
          <TakeFooter
            program={program.data}
            pending={take.isPending}
            onTake={() =>
              take.mutate(token, {
                onSuccess: copy => navigate(buildPath(ROUTES.PROGRAM, { programId: copy.id })),
              })
            }
          />
        )
      }
    >
      <QueryScreen query={program}>{p => <ProgramDetails program={p} />}</QueryScreen>
    </Screen>
  )
}

export default SharedProgramPage
