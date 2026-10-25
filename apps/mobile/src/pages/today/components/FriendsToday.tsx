import { View } from 'react-native';
import { router } from 'expo-router';

import { useFriends } from '@sportbot/api/entities/social';

import { toAssetUrl } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';
import { cn } from '@/shared/lib/utils';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';
import { Pressable } from '@/shared/ui/kit/Pressable';

const AVATARS = 4;

// Друзья, которые сегодня тоже потренировались — порт FriendsToday.tsx.
// Никого — блока нет: «никто не тренировался» не мотивирует
export const FriendsToday = () => {
  const friends = useFriends();
  const trained = friends.data?.filter((f) => f.trainedToday) ?? [];
  const [first] = trained;
  if (!first) return null;

  const text = trained.length > 1 ? `${first.displayName} и ещё ${trained.length - 1}` : first.displayName;

  return (
    <Rise className="px-gutter">
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: ROUTES.ME_SECTION, params: { section: 'friends' } })}
        className="border-border active:bg-mist flex-row items-center gap-3 border-[1.5px] p-3"
      >
        <View className="flex-row">
          {trained.slice(0, AVATARS).map((f, i) => (
            <PersonAvatar
              key={f.id}
              name={f.displayName}
              src={toAssetUrl(f.avatarUrl)}
              size="sm"
              className={cn('border-background border-2', i > 0 && '-ml-2')}
            />
          ))}
        </View>
        <View className="flex-1 min-w-0">
          <Eyebrow>Друзья сегодня</Eyebrow>
          <Text numberOfLines={1} className="mt-1">
            {text} — тоже потренировались
          </Text>
        </View>
      </Pressable>
    </Rise>
  );
};
