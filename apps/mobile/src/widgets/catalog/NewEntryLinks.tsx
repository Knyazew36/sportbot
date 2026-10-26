import { Plus } from 'lucide-react-native';
import { View } from 'react-native';

import type { CatalogKind } from '@sportbot/api/entities/catalog';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/kit/Button';

type NewEntryLinksProps = {
  /** Шторки создания живут на странице справочника: кнопки бывают в пустом состоянии, которое исчезает с первой записью */
  onCreate: (kind: CatalogKind) => void;
  /** В подвале — крупные, в пустом состоянии — как соседняя «Сбросить фильтры» */
  size?: 'default' | 'lg';
  className?: string;
};

// Нет нужного в справочнике — своя запись (frontend-tz, 11.4). Две кнопки в одну строку
export const NewEntryLinks = ({ onCreate, size = 'lg', className }: NewEntryLinksProps) => (
  <View className={cn('flex-row gap-2', className)}>
    <Button variant="outline" size={size} icon={Plus} className="flex-1" onPress={() => onCreate('exercise')}>
      Упражнение
    </Button>
    <Button variant="outline" size={size} icon={Plus} className="flex-1" onPress={() => onCreate('stretch')}>
      Растяжку
    </Button>
  </View>
);
