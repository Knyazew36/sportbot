import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';

import type { ProgramTagGroup, TagSelection } from '@sportbot/api/entities/program';

import { Button } from '@/shared/ui/kit/Button';
import { CHIP_ALL, ChipFilter } from '@/shared/ui/kit/ChipFilter';
import { CountBadge } from '@/shared/ui/kit/CountBadge';
import { Icon } from '@/shared/ui/kit/Icon';
import { SearchField } from '@/shared/ui/kit/SearchField';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow } from '@/shared/ui/kit/Typography';

type TemplateFilterProps = {
  groups: ProgramTagGroup[];
  selection: TagSelection;
  onSelectionChange: (selection: TagSelection) => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** Дополнительные фильтры шторки (источник, сортировка) — над группами тегов */
  more?: ReactNode;
  /** Сколько из дополнительных фильтров включено — для счётчика на кнопке */
  moreActive?: number;
  /** Сброс всего: без него в шторке нет «Сбросить» */
  onReset?: () => void;
  /** Подпись главной кнопки шторки: «Показать 12 программ» */
  showLabel?: string;
};

// Подбор программы — порт widgets/template-filter/TemplateFilter.tsx: поиск и один ряд быстрых чипов первой группы —
// список сразу под ними, а не под стеной фильтров. Остальные группы и доп. фильтры — в шторке, счётчик на кнопке
// говорит, что там что-то включено. Внутри группы — один чип, между группами — все сразу
export const TemplateFilter = ({
  groups,
  selection,
  onSelectionChange,
  search,
  onSearchChange,
  more,
  moreActive = 0,
  onReset,
  showLabel = 'Показать',
}: TemplateFilterProps) => {
  const [open, setOpen] = useState(false);
  const [quick, ...rest] = groups;
  const hidden = rest.filter((g) => selection[g.code]).length + moreActive;
  const withSheet = rest.length > 0 || more != null;

  const pick = (groupCode: string, tagCode: string) => {
    const { [groupCode]: _, ...others } = selection;
    onSelectionChange(tagCode === CHIP_ALL ? others : { ...others, [groupCode]: tagCode });
  };

  const chips = (g: ProgramTagGroup) => (
    <ChipFilter
      options={g.tags.map((t) => ({ value: t.code, label: t.name }))}
      value={selection[g.code] ?? CHIP_ALL}
      onValueChange={(next) => pick(g.code, next)}
    />
  );

  return (
    <View className="gap-2.5">
      <View className="flex-row gap-2">
        <SearchField
          value={search}
          onValueChange={onSearchChange}
          placeholder="Название или для кого"
          className="min-w-0 flex-1"
        />
        {withSheet && (
          // Высота поля поиска — кнопка стоит с ним в одну строку
          <View>
            <Button
              variant={hidden ? 'default' : 'outline'}
              size="icon"
              contentClassName="size-12"
              accessibilityLabel={hidden ? `Фильтры, включено ${hidden}` : 'Фильтры'}
              onPress={() => setOpen(true)}
            >
              <Icon as={SlidersHorizontal} className="size-5" />
            </Button>
            <CountBadge count={hidden} />
          </View>
        )}
      </View>
      {quick && chips(quick)}

      {withSheet && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title="Фильтры"
          footer={
            <View className="flex-row gap-2">
              {onReset && (
                <Button
                  variant="outline"
                  className="shrink-0"
                  onPress={() => {
                    onReset();
                    setOpen(false);
                  }}
                >
                  Сбросить
                </Button>
              )}
              <Button block className="min-w-0 flex-1" onPress={() => setOpen(false)}>
                {showLabel}
              </Button>
            </View>
          }
        >
          <View className="gap-5 pt-2">
            {more}
            {groups.map((g) => (
              <View key={g.id} className="gap-1.5">
                <Eyebrow>{g.name}</Eyebrow>
                {chips(g)}
              </View>
            ))}
          </View>
        </Sheet>
      )}
    </View>
  );
};
