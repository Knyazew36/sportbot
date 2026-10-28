import { View } from 'react-native';

import { MESSENGER_LABEL, useLinkState } from '@sportbot/api/entities/link';
import { type Profile, useAvatarFromMessenger, useRemoveAvatar } from '@sportbot/api/entities/profile';

import { toAssetUrl } from '@/shared/api';
import { useOnlineAction } from '@/shared/lib/hooks/use-online-action';
import { Button } from '@/shared/ui/kit/Button';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';

// Фото — порт pages/me-section/components/PhotoSection.tsx: сменить — камерой на карте участника,
// здесь — убрать или забрать из мессенджера
export const PhotoSection = ({ profile }: { profile: Profile }) => {
  const links = useLinkState();
  const remove = useRemoveAvatar();
  const fromMessenger = useAvatarFromMessenger();
  const linked = links.data?.linked ?? [];
  const net = useOnlineAction();

  return (
    <ScreenSection>
      <View className="flex-row items-center gap-4">
        <PersonAvatar name={profile.displayName} src={toAssetUrl(profile.avatarUrl)} tone="accent" size="lg" />
        <View className="min-w-0 flex-1 flex-row flex-wrap gap-2">
          {profile.avatarUrl ? (
            <Button variant="outline" size="xs" loading={remove.isPending} disabled={net.disabled} onPress={() => remove.mutate()}>
              {net.label('Убрать фото')}
            </Button>
          ) : (
            // Фото нет — сам убрал или в мессенджере его не нашлось при входе: предлагаем забрать оттуда
            linked.map((m) => (
              <Button
                key={m}
                variant="outline"
                size="xs"
                disabled={fromMessenger.isPending || net.disabled}
                onPress={() => fromMessenger.mutate(m)}
              >
                {net.label(`Взять фото из ${MESSENGER_LABEL[m]}`)}
              </Button>
            ))
          )}
        </View>
      </View>
    </ScreenSection>
  );
};
