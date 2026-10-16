import { Trash2Icon } from 'lucide-react'

import { useDeleteAccount } from '@/features/delete-account/useDeleteAccount'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Удаление данных (frontend-tz, 13.8): что сотрётся и что останется, подтверждение словом «удалить»
export const DeleteDataSection = () => {
  const remove = useDeleteAccount()

  return (
    <ScreenSection>
      <div className='border-destructive/60 flex flex-col gap-3 border-[1.5px] border-dashed p-4'>
        <div className='flex flex-col gap-4'>
          <div>
            <Eyebrow
              as='p'
              tone='danger'
              className='mb-1.5'
            >
              Сотрётся
            </Eyebrow>
            <Text
              as='ul'
              size='xs'
              tone='soft'
              className='flex flex-col gap-1'
            >
              <li>тренировки и веса</li>
              <li>программы и черновики</li>
              <li>вес тела, ограничения</li>
              <li>друзья</li>
            </Text>
          </div>
          <div>
            <Eyebrow
              as='p'
              className='mb-1.5'
            >
              Останется
            </Eyebrow>
            <Text
              as='ul'
              size='xs'
              tone='soft'
              className='flex flex-col gap-1'
            >
              <li>упражнения, которые ты отдал в общий справочник — без имени</li>
              <li>копии твоих программ у друзей</li>
            </Text>
          </div>
        </div>
        <ConfirmAction
          trigger={
            <Button
              variant='destructive'
              className='w-full'
            />
          }
          title='Удалить все данные?'
          description='Это не отменить. После удаления приложение начнётся с первого запуска.'
          confirmLabel='Удалить навсегда'
          confirmWord='удалить'
          onConfirm={() => remove.mutateAsync()}
        >
          <Trash2Icon />
          Удалить мои данные
        </ConfirmAction>
      </div>
    </ScreenSection>
  )
}
