import { View } from 'react-native';
import { Send } from 'lucide-react-native';

import { type CatalogKind, usePublishEntry } from '@sportbot/api/entities/catalog';

import { Button } from '@/shared/ui/kit/Button';
import { Text } from '@/shared/ui/kit/Typography';

type PublishEntryProps = {
  kind: CatalogKind;
  entry: { id: number; mine: boolean; pendingReview: boolean; canPublish: boolean };
};

// Своя личная запись попадает в общий справочник только по явной кнопке и после проверки — порт PublishEntry.tsx
export const PublishEntry = ({ kind, entry }: PublishEntryProps) => {
  const publish = usePublishEntry();

  if (!entry.mine) return null;
  if (entry.pendingReview)
    return (
      <Text size="sm" tone="muted">
        На проверке у администратора — бот напишет исход.
      </Text>
    );
  if (!entry.canPublish) return null;
  return (
    <View className="gap-2">
      <Text size="sm" tone="muted">
        Видна только тебе. Опубликуй — после проверки появится в общем справочнике.
      </Text>
      <Button
        variant="share"
        icon={Send}
        loading={publish.isPending}
        onPress={() => publish.mutate({ kind, id: entry.id })}
      >
        Опубликовать
      </Button>
    </View>
  );
};
