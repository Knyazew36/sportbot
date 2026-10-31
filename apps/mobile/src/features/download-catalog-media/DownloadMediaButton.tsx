import { ImageDown, X } from 'lucide-react-native';

import { useLocalDb } from '@/shared/db';
import { Button } from '@/shared/ui/kit/Button';

import { useOfflineMedia } from './useOfflineMedia';

type InnerProps = { db: NonNullable<ReturnType<typeof useLocalDb>> };

const Inner = ({ db }: InnerProps) => {
  const { progress, start, cancel } = useOfflineMedia(db);

  if (progress) {
    return (
      <Button variant="outline" size="sm" icon={X} onPress={cancel}>
        {`${progress.done}/${progress.total}`}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" icon={ImageDown} accessibilityLabel="Скачать картинки справочника" onPress={start}>
      Скачать
    </Button>
  );
};

// Кнопка «Скачать» в шапке справочника: картинки упражнений и растяжек для зала без сети.
// Пока локальная база не открылась, качать нечего — кнопки нет.
export const DownloadMediaButton = () => {
  const db = useLocalDb();
  return db ? <Inner db={db} /> : null;
};
