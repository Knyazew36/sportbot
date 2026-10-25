import { View } from 'react-native';

import { type CatalogKind, useSimilar } from '@sportbot/api/entities/catalog';
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value';
import { List } from '@/shared/ui/kit/ListRow';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

import { CatalogRow } from './CatalogRow';

type SimilarEntriesProps = {
  kind: CatalogKind;
  name: string;
  /** Похожее подошло: замена ставит его сразу, справочник открывает карточку */
  onPick: (entry: { id: number; name: string }) => void;
  /** Что делать, если похожее не подошло */
  hint?: string;
};

// «Возможно, ты искал…» — порт widgets/catalog/SimilarEntries.tsx: похожие записи, чтобы не плодить дубли
export const SimilarEntries = ({ kind, name, onPick, hint = 'Не то? Жми «Дальше» — создадим своё.' }: SimilarEntriesProps) => {
  const similar = useSimilar(kind, useDebouncedValue(name.trim(), 400));
  if (!similar.data?.length) return null;
  return (
    <View className="gap-3">
      <View className="flex-row items-end justify-between gap-3">
        <Eyebrow tone="primary">Возможно, ты искал…</Eyebrow>
        <Eyebrow>уже есть в справочнике</Eyebrow>
      </View>
      <List>
        {similar.data.map((m) => (
          <CatalogRow
            key={m.id}
            name={m.name}
            imageUrl={null}
            meta={kind === 'exercise' ? 'упражнение справочника' : 'растяжка справочника'}
            onPress={() => onPick({ id: m.id, name: m.name })}
          />
        ))}
      </List>
      <Text size="xs" tone="muted">
        {hint}
      </Text>
    </View>
  );
};
