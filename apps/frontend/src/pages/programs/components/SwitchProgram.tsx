import { LibraryIcon, PlusIcon } from 'lucide-react'

import { useCatalog } from '@sportbot/api/entities/program'
import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram'
import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Poster } from '@/shared/ui/kit/Typography'

import { DoorTicket } from './DoorTicket'

type SwitchProgramProps = {
  /** Сколько программ, кроме активной; нет других — билет «Мои программы» не нужен */
  otherCount: number
  hasActive: boolean
}

// Три пути к другой программе: свои, готовые, с нуля. Списков здесь нет, чтобы главным на экране оставалась
// активная программа. Заголовок свой: ScreenSection подписи не показывает, а без неё билеты непонятны
export const SwitchProgram = ({ otherCount, hasActive }: SwitchProgramProps) => {
  // Те же фильтры, что у каталога без выбора: запросы общие, и каталог откроется сразу
  const catalog = useCatalog({ scope: 'all', tagIds: [], search: '' })
  const blank = useCreateBlankProgram()
  const catalogCount = catalog.data ? catalog.data.templates.length + catalog.data.users.length : null

  return (
    <Rise className='px-gutter mt-20 flex flex-col gap-4'>
      <Poster
        as='h2'
        size='md'
      >
        {hasActive ? 'Сменить программу' : 'Выбрать программу'}
      </Poster>
      <div className='flex flex-col gap-4'>
        {otherCount > 0 && (
          <DoorTicket
            to={ROUTES.PROGRAMS_MINE}
            tone='ink'
            mark={otherCount}
            title='Мои программы'
            meta={hasActive ? 'включить другую' : 'включить одну из них'}
          />
        )}
        <DoorTicket
          to={ROUTES.PROGRAM_TEMPLATES}
          tone='blue'
          mark={catalogCount || <LibraryIcon className='size-8' />}
          title='Готовые программы'
          meta='каталог с поиском и фильтрами'
        />
        <DoorTicket
          tone='draft'
          mark={
            <PlusIcon
              className='size-8'
              strokeWidth={2.5}
            />
          }
          title='Собрать свою'
          meta='с чистого листа'
          disabled={blank.isPending}
          onClick={() => void blank.create()}
        />
      </div>
    </Rise>
  )
}
