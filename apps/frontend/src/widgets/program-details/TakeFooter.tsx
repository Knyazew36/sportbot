import { PlusIcon } from 'lucide-react'

import type { Program } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { StickyFooter } from '@/shared/ui/kit/Screen'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type TakeFooterProps = {
  program: Program
  onTake: () => void
  pending: boolean
}

// «Взять себе» под чужой программой: из каталога и по ссылке «Поделиться»
export const TakeFooter = ({ program, onTake, pending }: TakeFooterProps) => {
  if (program.mine)
    return (
      // Своя программа: брать копию у себя незачем — открываем её редактор
      <StickyFooter>
        <ButtonLink
          to={buildPath(ROUTES.PROGRAM, { programId: program.id })}
          size='lg'
          className='w-full'
        >
          Открыть мою
        </ButtonLink>
      </StickyFooter>
    )

  const taken = program.takenProgramId != null
  return (
    // Две кнопки держим в одну строку: обе lg и короткие подписи, чтобы влезали от 375px
    <StickyFooter className='flex-nowrap'>
      {/* Уже взята — главное «Открыть»; второй экземпляр берут осознанно */}
      {taken && (
        <ButtonLink
          to={buildPath(ROUTES.PROGRAM, { programId: program.takenProgramId! })}
          size='lg'
          className='flex-1'
        >
          Открыть мою
        </ButtonLink>
      )}
      <Button
        size='lg'
        variant={taken ? 'outline' : 'default'}
        disabled={pending}
        onClick={onTake}
      >
        {taken ? 'Ещё раз' : 'Взять себе'}
        <PlusIcon
          className={taken ? 'size-5' : 'size-7'}
          strokeWidth={2.5}
        />
      </Button>
    </StickyFooter>
  )
}
