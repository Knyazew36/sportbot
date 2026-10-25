import { Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

import { supersetLabels, supersetLetter } from '@sportbot/api/lib/superset';

import { Eyebrow } from './Typography';

type ExerciseBlocksProps<T> = {
  items: T[];
  /** Строка упражнения (ListRow); label — «A1» у участника суперсета, иначе null; last — последняя в суперсете */
  children: (item: T, index: number, label: string | null, last: boolean) => ReactNode;
};

// Упражнения внутри List — порт shared/ui/kit/ExerciseBlocks.tsx: одиночные — обычными строками,
// суперсет — группой с синим корешком, чтобы было видно, что их делают вместе по кругу
export const ExerciseBlocks = <T extends { superset: number | null }>({ items, children }: ExerciseBlocksProps<T>) => {
  const labels = supersetLabels(items);
  const blocks: { superset: number | null; indexes: number[] }[] = [];
  items.forEach((item, i) => {
    const last = blocks.at(-1);
    if (last && item.superset !== null && last.superset === item.superset) last.indexes.push(i);
    else blocks.push({ superset: item.superset, indexes: [i] });
  });

  return blocks.map((block) => {
    const inSuperset = block.superset !== null;
    const rows = block.indexes.map((i, n) => (
      <Fragment key={i}>
        {children(items[i]!, i, labels[i] ?? null, inSuperset && n === block.indexes.length - 1)}
      </Fragment>
    ));
    if (!inSuperset) return rows;
    return (
      <View key={`s${block.superset}`} className="border-border flex-row gap-3 border-b-[1.5px] py-2">
        {/* Надпись вдоль корешка: суперсет видно сразу, строкам не нужна лишняя шапка */}
        <View className="bg-primary w-6 items-center justify-center overflow-hidden">
          <Eyebrow tone="inverse" numberOfLines={1} className="w-40 -rotate-90 text-center">
            Суперсет {supersetLetter(block.superset!)}
          </Eyebrow>
        </View>
        <View className="min-w-0 flex-1">{rows}</View>
      </View>
    );
  });
};
