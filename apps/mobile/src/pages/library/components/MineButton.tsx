import { View } from 'react-native';

import { useMyEntriesCount } from '@sportbot/api/entities/catalog';
import { Button } from '@/shared/ui/kit/Button';
import { CountBadge } from '@/shared/ui/kit/CountBadge';

type MineButtonProps = {
  onPress: () => void;
};

// «Мои» в шапке справочника: свои записи и их заявки. Счётчик — сколько записей уже есть.
export const MineButton = ({ onPress }: MineButtonProps) => {
  const count = useMyEntriesCount();
  return (
    <View>
      <Button
        variant="outline"
        size="sm"
        accessibilityLabel={count.data ? `Мои, записей: ${count.data}` : 'Мои'}
        onPress={onPress}
      >
        Мои
      </Button>
      <CountBadge count={count.data ?? 0} />
    </View>
  );
};
