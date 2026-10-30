import { View } from 'react-native';
import { router } from 'expo-router';
import { Library, Plus } from 'lucide-react-native';

import { useCatalog } from '@sportbot/api/entities/program';

import { useCreateBlankProgram } from '@/features/create-program/useCreateBlankProgram';
import { ROUTES } from '@/shared/config/routes';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Poster } from '@/shared/ui/kit/Typography';

import { DoorTicket } from './DoorTicket';

type SwitchProgramProps = {
  /** Сколько программ, кроме активной; нет других — билет «Мои программы» не нужен */
  otherCount: number;
  hasActive: boolean;
};

// Три пути к другой программе — порт pages/programs/components/SwitchProgram.tsx. Заголовок свой:
// ScreenSection подписи не показывает, а без неё билеты непонятны
export const SwitchProgram = ({ otherCount, hasActive }: SwitchProgramProps) => {
  // Те же фильтры, что у каталога без выбора: запросы общие, и каталог откроется сразу
  const catalog = useCatalog({ scope: 'all', tagIds: [], search: '' });
  const blank = useCreateBlankProgram();
  const catalogCount = catalog.data ? catalog.data.templates.length + catalog.data.users.length : null;

  return (
    <Rise className="px-gutter mt-20 gap-4">
      <Poster size="md">{hasActive ? 'Сменить программу' : 'Выбрать программу'}</Poster>
      <View className="gap-4">
        {otherCount > 0 && (
          <DoorTicket
            tone="ink"
            mark={otherCount}
            title="Мои программы"
            meta={hasActive ? 'включить другую' : 'включить одну из них'}
            onPress={() => router.push(ROUTES.PROGRAMS_MINE)}
          />
        )}
        <DoorTicket
          tone="blue"
          mark={catalogCount || <Icon as={Library} className="text-primary-foreground size-8" />}
          title="Готовые программы"
          meta="каталог с поиском и фильтрами"
          onPress={() => router.push(ROUTES.PROGRAM_TEMPLATES)}
        />
        <DoorTicket
          tone="draft"
          mark={<Icon as={Plus} strokeWidth={2.5} className="text-foreground size-8" />}
          title="Собрать свою"
          meta="с чистого листа"
          disabled={blank.isPending}
          onPress={() => void blank.create().catch(() => undefined)}
        />
      </View>
    </Rise>
  );
};
