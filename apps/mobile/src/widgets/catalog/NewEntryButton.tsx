import { useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';

import type { CatalogKind } from '@sportbot/api/entities/catalog';
import { Button } from '@/shared/ui/kit/Button';
import { OptionButton } from '@/shared/ui/kit/OptionButton';
import { Sheet } from '@/shared/ui/kit/Sheet';

type NewEntryButtonProps = {
  onCreate: (kind: CatalogKind) => void;
};

// «Мои записи»: одна кнопка «Добавить», что создать — выбираем в шторке
export const NewEntryButton = ({ onCreate }: NewEntryButtonProps) => {
  const [choosing, setChoosing] = useState(false);

  const pick = (kind: CatalogKind) => {
    setChoosing(false);
    onCreate(kind);
  };

  return (
    <>
      <Button variant="outline" size="lg" icon={Plus} block onPress={() => setChoosing(true)}>
        Добавить
      </Button>
      <Sheet open={choosing} onOpenChange={setChoosing} title="Что добавить?">
        <View className="gap-2">
          <OptionButton title="Упражнение" onPress={() => pick('exercise')} />
          <OptionButton title="Растяжку" onPress={() => pick('stretch')} />
        </View>
      </Sheet>
    </>
  );
};
