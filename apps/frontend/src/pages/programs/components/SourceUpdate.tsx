import { RefreshCwIcon, SparklesIcon } from 'lucide-react'

import { type ProgramListItem, useDismissProgramUpdate, useResyncProgram } from '@/entities/program'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Друг или каталог поменяли исходную программу: обновление перезапишет свои правки, история останется
// (frontend-tz, 10.4). «Не сейчас» прячет плашку до следующей правки источника
export const SourceUpdate = ({ program }: { program: ProgramListItem }) => {
  const resync = useResyncProgram()
  const dismiss = useDismissProgramUpdate()

  return (
    <Rise className='px-gutter'>
      <div className='border-primary bg-accent flex flex-col gap-3 border-[1.5px] p-4'>
        <Eyebrow
          as='p'
          tone='primary'
          className='flex items-center gap-2'
        >
          <SparklesIcon className='size-3.5' />
          {program.fromTemplate ? 'Шаблон обновился' : `${program.fromFriend} обновил программу`}
        </Eyebrow>
        <Text>
          {program.fromTemplate
            ? `«${program.name}» в каталоге изменилась. Можно забрать новую версию себе.`
            : `«${program.name}» у друга изменилась. Можно забрать новую версию себе.`}
        </Text>
        <div className='flex flex-wrap gap-2'>
          <ConfirmAction
            trigger={
              <Button
                variant='alert'
                size='sm'
              />
            }
            title='Обновить у себя?'
            description='Твои правки в этой программе заменятся новой версией. История тренировок и весов сохранится.'
            confirmLabel='Обновить'
            confirmVariant='default'
            onConfirm={() => resync.mutateAsync(program.id)}
          >
            <RefreshCwIcon />
            Обновить у себя
          </ConfirmAction>
          <Button
            variant='outline'
            size='sm'
            disabled={dismiss.isPending}
            onClick={() => dismiss.mutate(program.id)}
          >
            Не сейчас
          </Button>
        </div>
      </div>
    </Rise>
  )
}
