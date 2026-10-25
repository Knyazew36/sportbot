import { View } from 'react-native';

import type { Me } from '@sportbot/api/entities/session';

import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

// Карта участника — упрощённый порт AccountCard.tsx: кто ты в Спортботе одним взглядом.
// Чёрная плашка с синей жёсткой тенью — та же «нажимаемость», но в масштабе вещи. Фото и мессенджеры — этап 2
export const AccountCard = ({ user }: { user: Me }) => {
  const displayName = [user.name, user.lastName].filter(Boolean).join(' ') || 'Спортсмен';

  return (
    <View className="px-gutter">
      <InkPanel shadow className="gap-4 p-5">
        <View className="flex-row items-baseline justify-between gap-3">
          <Eyebrow tone="inverseMuted">Спортбот · карта участника</Eyebrow>
          <Poster size="xs" numeric>
            {`№ ${String(user.id).padStart(6, '0')}`}
          </Poster>
        </View>
        <Poster size="xl" numberOfLines={1}>
          {displayName}
        </Poster>
        {user.email ? (
          <Text size="sm" tone="inverseMuted">
            {user.email}
          </Text>
        ) : null}
      </InkPanel>
    </View>
  );
};
