import { View } from 'react-native';
import { Globe, Pencil } from 'lucide-react-native';

import { isPublishable, type Program } from '@sportbot/api/entities/program';

import { ShareProgramButton } from '@/features/share-program/ShareProgramButton';
import { cn } from '@/shared/lib/utils';
import { Button, type ButtonSize } from '@/shared/ui/kit/Button';

type ShowOthersProps = {
  program: Program;
  onPublish: () => void;
  size?: ButtonSize;
  className?: string;
};

// Оба пути наружу рядом — порт features/publish-program/ShowOthers.tsx: всем — в каталог, другу — ссылкой.
// «Медаль» всегда одна: черновик зовёт в каталог, а уже отправленную остаётся только раздавать друзьям
export const ShowOthers = ({ program: p, onPublish, size, className }: ShowOthersProps) => {
  const publishable = isPublishable(p);
  const toCatalog = publishable && (p.publication === 'DRAFT' || p.publication === 'REJECTED');

  return (
    <View className={cn('flex-row gap-2', className)}>
      {publishable && (
        <Button
          variant={toCatalog ? 'share' : 'outline'}
          size={size}
          icon={toCatalog ? Globe : Pencil}
          block
          className="min-w-0 flex-1"
          contentClassName="px-3"
          onPress={onPublish}
        >
          {p.publication === 'DRAFT' ? 'В каталог' : p.publication === 'REJECTED' ? 'Исправить' : 'Описание'}
        </Button>
      )}
      <ShareProgramButton
        programId={p.id}
        size={size}
        variant={toCatalog ? 'outline' : 'share'}
        label={publishable ? 'Другу' : 'Поделиться с другом'}
        block
        className={publishable ? 'min-w-0 flex-1' : 'flex-1'}
      />
    </View>
  );
};
