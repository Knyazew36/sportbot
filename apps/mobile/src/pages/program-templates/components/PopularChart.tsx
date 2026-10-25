import { View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, ArrowUpRight } from 'lucide-react-native';

import { addedText, catalogSourceOf, type Program } from '@sportbot/api/entities/program';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/shared/ui/kit/Icon';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { catalogItemPath } from '@/widgets/program-templates/catalog-item-path';
import { Pressable } from '@/shared/ui/kit/Pressable';

type PopularChartProps = { list: Program[]; onShowAll: () => void };

// Рейтинг — главный акцент витрины: чёрная плашка с дорожками, места крупными цифрами. Социальное доказательство
// раньше фильтров: новичку проще начать с того, что уже взяли другие
export const PopularChart = ({ list, onShowAll }: PopularChartProps) => (
  <Rise className="px-gutter">
    <InkPanel shadow>
      <View className="gap-1 px-4 pt-4 pb-2">
        <Eyebrow tone="inverseMuted">популярное</Eyebrow>
        <Poster size="xl" tone="inverse">
          Берут чаще всего
        </Poster>
      </View>
      {list.map((t, i) => (
        <Pressable
          key={t.id}
          accessibilityRole="link"
          onPress={() => {
            haptic.tap();
            router.push(catalogItemPath(t.id, catalogSourceOf(t)));
          }}
          className={cn(
            'active:bg-background/5 flex-row items-center gap-3 px-4 py-2.5',
            i > 0 && 'border-background/15 border-t',
          )}
        >
          <Poster size="2xl" numeric tone={i === 0 ? 'primary' : 'inverseMuted'} className="w-8 shrink-0 text-center">
            {String(i + 1)}
          </Poster>
          <View className="min-w-0 flex-1 gap-0.5">
            <Poster size="sm" tone="inverse" numberOfLines={1}>
              {t.name}
            </Poster>
            <Eyebrow tone="inverseMuted" numberOfLines={1}>
              {addedText(t.addedCount)}
              {t.author && ` · ${t.author.name}`}
            </Eyebrow>
          </View>
          <Icon as={ArrowUpRight} className="text-background/50 size-5 shrink-0" />
        </Pressable>
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={onShowAll}
        className="border-background/15 active:bg-background/5 flex-row items-center justify-between border-t px-4 py-3"
      >
        <Eyebrow tone="inverse">весь рейтинг</Eyebrow>
        <Icon as={ArrowRight} className="text-background/80 size-4" />
      </Pressable>
    </InkPanel>
  </Rise>
);
