import { RefreshCwIcon, SparklesIcon } from 'lucide-react'

import { type ProgramListItem, useResyncProgram } from '@/entities/program'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Друг поменял исходную программу: обновление перезапишет свои правки, история останется (frontend-tz, 10.4)
export const FriendUpdate = ({ program }: { program: ProgramListItem }) => {
  const resync = useResyncProgram()

  return (
    <Rise className='px-5'>
      <div className='border-primary bg-accent flex flex-col gap-3 border-[1.5px] p-4'>
        <Eyebrow
          as='p'
          tone='primary'
          className='flex items-center gap-2'
        >
          <SparklesIcon className='size-3.5' />
          {program.fromFriend} обновил программу
        </Eyebrow>
        <Text>«{program.name}» у друга изменилась. Можно забрать новую версию себе.</Text>
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
          confirmVariant='default'
          onConfirm={() => resync.mutateAsync(program.id)}
        >
          <RefreshCwIcon />
          Обновить у себя
        </ConfirmAction>
      </div>
    </Rise>
  )
}
