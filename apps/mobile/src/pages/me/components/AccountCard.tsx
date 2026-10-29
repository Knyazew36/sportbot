import { View } from 'react-native';
import { Camera, Check } from 'lucide-react-native';

import { MESSENGER_LABEL, useLinkState } from '@sportbot/api/entities/link';
import type { Profile } from '@sportbot/api/entities/profile';
import { useSportUser } from '@sportbot/api/entities/sport-user';

import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { usePickAvatar } from '../model/use-pick-avatar';

const ROLE = { MALE: 'спортсмен', FEMALE: 'спортсменка' } as const;

// Вырез-перфорация поперёк карты — тот же корешок, что у билетов комплексов
const Perforation = () => (
  <View className="-mx-5 my-5 justify-center">
    <View className="border-background/25 border-t-[1.5px] border-dashed" />
    <View className="bg-background absolute -left-2 size-4 rounded-full" />
    <View className="bg-background absolute -right-2 size-4 rounded-full" />
  </View>
);

// Фото на карте: камера поверх — сменить; при первом входе фото берётся из мессенджера
const CardPhoto = ({ profile }: { profile: Profile }) => {
  const avatar = usePickAvatar();

  return (
    <View>
      <View className="border-background/90 rounded-full border-[1.5px] p-1">
        <PersonAvatar
          name={profile.displayName}
          src={toAssetUrl(profile.avatarUrl)}
          tone="accent"
          className="size-[84px]"
        />
      </View>
      <View className="absolute -right-2 -bottom-1">
        <Button
          variant="paper"
          size="icon-sm"
          accessibilityLabel={profile.avatarUrl ? 'Сменить фото' : 'Загрузить фото'}
          loading={avatar.pending}
          onPress={() => void avatar.pick()}
        >
          <Icon as={Camera} className="size-4" />
        </Button>
      </View>
    </View>
  );
};

// Карта участника — порт pages/me/components/AccountCard.tsx: фото, имя, номер и где на связи
export const AccountCard = ({ profile }: { profile: Profile }) => {
  const me = useSportUser();
  const links = useLinkState();
  const linked = links.data?.linked ?? [];

  return (
    <Rise className="px-gutter">
      <InkPanel shadow className="p-5">
        <View className="flex-row items-baseline justify-between gap-3">
          <Eyebrow tone="inverseMuted">Спортбот · карта участника</Eyebrow>
          {me.data ? (
            <Poster size="xs" tone="inverse" numeric>
              {`№ ${String(me.data.userId).padStart(6, '0')}`}
            </Poster>
          ) : null}
        </View>

        <View className="mt-6 flex-row items-end gap-5">
          <CardPhoto profile={profile} />
          <View className="min-w-0 flex-1 pb-1">
            {profile.gender ? (
              <Eyebrow tone="inverseMuted" className="mb-1">
                {ROLE[profile.gender]}
              </Eyebrow>
            ) : null}
            <Poster size="3xl" tone="inverse" fit>
              {profile.displayName}
            </Poster>
          </View>
        </View>

        <Perforation />

        <View className="flex-row justify-end">
          <View className="items-end gap-1.5">
            <Eyebrow tone="inverseMuted">на связи</Eyebrow>
            <View className="flex-row gap-1.5">
              {linked.map((m) => (
                // Печать мессенджера: штамп на карте, а не бейдж — это факт, а не тег
                <View key={m} className="border-background/70 flex-row items-center gap-1 border-[1.5px] px-1.5 py-0.5">
                  <Icon as={Check} className="text-background size-3" />
                  <Text size="xs" tone="inverse" className="tracking-[0.06em] uppercase">
                    {MESSENGER_LABEL[m]}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </InkPanel>
    </Rise>
  );
};
