import { ScrollView } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { Segmented } from './Segmented';

/** «Все» — значение без фильтра */
export const CHIP_ALL = 'all';

type ChipFilterProps = {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

// Один фильтр за раз над списком — порт shared/ui/kit/ChipFilter.tsx: «Все · Дом · Зал».
// Чипов может быть больше, чем влезает, — строка прокручивается вбок, а не переносится
export const ChipFilter = ({ options, value, onValueChange, className }: ChipFilterProps) =>
  options.length ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('-mx-gutter', className)}
      contentContainerClassName="px-gutter pb-1"
    >
      <Segmented options={[{ value: CHIP_ALL, label: 'Все' }, ...options]} value={value} onValueChange={onValueChange} />
    </ScrollView>
  ) : null;
