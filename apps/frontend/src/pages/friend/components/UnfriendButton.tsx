import { UserMinusIcon } from 'lucide-react'

import { type FriendProfile, useUnfriend } from '@sportbot/api/entities/social'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type UnfriendButtonProps = {
  friend: FriendProfile
  onDone: () => void
}

// Удаление из друзей: уведомления нет, статистика пропадает у обоих, копии программ остаются
export const UnfriendButton = ({ friend: f, onDone }: UnfriendButtonProps) => {
  const unfriend = useUnfriend()
  return (
    <Rise className='px-gutter pb-6'>
      <ConfirmAction
        trigger={
          <Button
            variant='destructive'
            className='w-full'
          />
        }
        title={`Удалить ${f.displayName} из друзей?`}
        description='Уведомление не придёт. Статистика пропадёт у вас обоих, копии программ останутся.'
        confirmLabel='Удалить'
        onConfirm={() => unfriend.mutateAsync(f.id).then(onDone)}
      >
        <UserMinusIcon />
        Удалить из друзей
      </ConfirmAction>
    </Rise>
  )
}
