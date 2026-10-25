import { Share } from 'react-native';
import { router } from 'expo-router';
import { Share2 } from 'lucide-react-native';

import { useCreateInvite, useFriends } from '@sportbot/api/entities/social';

import { toAssetUrl } from '@/shared/api';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { List, ListLinkRow } from '@/shared/ui/kit/ListRow';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Text } from '@/shared/ui/kit/Typography';

// Друзья — порт pages/me-section/components/FriendsSection.tsx: список с серией и «сегодня тренировался»,
// приглашение через системное «Поделиться» — оно есть на любом телефоне, копировать ссылку не нужно
export const FriendsSection = () => {
  const friends = useFriends();
  const invite = useCreateInvite();

  const share = () =>
    invite.mutate(undefined, {
      onSuccess: (link) => void Share.share({ message: `${link.text}\n${link.url}`, url: link.url }),
    });

  return (
    <ScreenSection aside={friends.data?.length ? `${friends.data.length} в списке` : undefined}>
      {friends.data?.length ? (
        <List>
          {friends.data.map((f) => (
            <ListLinkRow
              key={f.id}
              onPress={() => router.push(routeHref(ROUTES.FRIEND, { friendId: f.id }))}
              lead={<PersonAvatar name={f.displayName} src={toAssetUrl(f.avatarUrl)} size="sm" />}
              title={f.displayName}
              meta={f.paused ? 'на паузе' : `серия ${f.currentStreak}`}
            >
              {f.trainedToday ? (
                <Badge variant="secondary" className="mt-2">
                  сегодня тренировался
                </Badge>
              ) : null}
            </ListLinkRow>
          ))}
        </List>
      ) : (
        <Text tone="muted">Друзей пока нет. Пригласи — будете видеть тренировки и серии друг друга.</Text>
      )}
      <Button variant="share" block icon={Share2} loading={invite.isPending} onPress={share}>
        Пригласить друга
      </Button>
    </ScreenSection>
  );
};
