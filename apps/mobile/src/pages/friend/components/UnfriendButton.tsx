import { UserMinus } from 'lucide-react-native';

import { type FriendProfile, useUnfriend } from '@sportbot/api/entities/social';

import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Rise } from '@/shared/ui/kit/Reveal';

type UnfriendButtonProps = {
  friend: FriendProfile;
  onDone: () => void;
};

// Удаление из друзей: уведомления нет, статистика пропадает у обоих, копии программ остаются
export const UnfriendButton = ({ friend, onDone }: UnfriendButtonProps) => {
  const unfriend = useUnfriend();
  return (
    <Rise className="px-gutter pb-6">
      <ConfirmAction
        trigger={<Button variant="destructive" block icon={UserMinus} />}
        title={`Удалить ${friend.displayName} из друзей?`}
        description="Уведомление не придёт. Статистика пропадёт у вас обоих, копии программ останутся."
        confirmLabel="Удалить"
        onConfirm={() => unfriend.mutateAsync(friend.id).then(onDone)}
      >
        Удалить из друзей
      </ConfirmAction>
    </Rise>
  );
};
