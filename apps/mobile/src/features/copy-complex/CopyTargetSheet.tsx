import { useState } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import type { ProgramListItem } from '@sportbot/api/entities/program';

import { WORKOUT_FORMS } from '@/shared/lib/plural-forms';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/shared/ui/kit/Icon';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { EmptyState } from '@/shared/ui/kit/EmptyState';
import { SearchField } from '@/shared/ui/kit/SearchField';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

import { SEARCH_FROM, sortTargets } from './sort-targets';

type CopyTargetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: ProgramListItem[];
  pending: boolean;
  onPick: (programId: number) => void;
};

// Выбор своей программы, куда скопировать тренировку — порт features/copy-complex/CopyTargetSheet.tsx.
// Программ много — появляется поиск
export const CopyTargetSheet = ({ open, onOpenChange, programs, pending, onPick }: CopyTargetSheetProps) => {
  const [search, setSearch] = useState('');
  const shown = sortTargets(programs, search);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSearch('');
      }}
      title="Куда скопировать"
      description="Тренировка встанет в конец очереди программы"
    >
      {programs.length >= SEARCH_FROM && (
        <SearchField value={search} onValueChange={setSearch} placeholder="Название программы" className="pb-3" />
      )}
      {shown.length === 0 ? (
        <EmptyState eyebrow="пусто · поиск" title="Ничего не нашлось" description="Попробуй другое название." />
      ) : (
        <List>
          {shown.map((p) => (
            // Вся строка — кнопка выбора
            <ListRow
              key={p.id}
              className={cn('-mx-gutter px-gutter', pending && 'opacity-60')}
              title={p.name}
              meta={pluralize(p.complexCount, WORKOUT_FORMS)}
              onPress={pending ? undefined : () => onPick(p.id)}
              trail={
                p.active ? (
                  <View className="flex-row items-center gap-1">
                    <Icon as={Check} className="text-primary size-3.5" />
                    <Text size="xs" tone="primary">
                      активная
                    </Text>
                  </View>
                ) : undefined
              }
            />
          ))}
        </List>
      )}
    </Sheet>
  );
};
