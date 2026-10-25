import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Upload } from 'lucide-react-native';

import type { CatalogData } from '@sportbot/api/entities/program';

import { ROUTES } from '@/shared/config/routes';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';
import { TemplateCard } from '@/widgets/program-templates/TemplateCard';
import { TemplateTile } from '@/widgets/program-templates/TemplateTile';

import { byPopularity } from '../model/by-popularity';
import { CHART, CHART_MIN, COMMUNITY } from '../model/constants';
import { PopularChart } from './PopularChart';
import { SectionHeading } from './SectionHeading';
import { Pressable } from '@/shared/ui/kit/Pressable';

type CatalogShowcaseProps = {
  data: CatalogData;
  /** «Все» у ленты сообщества: включить фильтр «от пользователей» */
  onShowCommunity: () => void;
  /** «Весь рейтинг» под плашкой популярного: включить сортировку по популярности */
  onShowPopular: () => void;
};

// Витрина без фильтров — как стенд с афишами: рейтинг того, что берут чаще, лента программ пользователей
// (их видно сразу, а не за табом) и весь каталог билетами. Лента сообщества кончается приглашением
// опубликовать свою: так каталог растёт
export const CatalogShowcase = ({ data, onShowCommunity, onShowPopular }: CatalogShowcaseProps) => {
  const all = [...data.templates, ...data.users];
  const chart = byPopularity(all.filter((t) => t.addedCount > 0)).slice(0, CHART);

  return (
    <>
      {chart.length >= CHART_MIN && <PopularChart list={chart} onShowAll={onShowPopular} />}

      <Rise className="gap-3">
        <SectionHeading
          title="От сообщества"
          aside="собрали другие — бери и правь под себя"
          action={
            data.users.length > COMMUNITY && (
              <Button
                variant="link"
                size="sm"
                iconRight={ArrowRight}
                contentClassName="min-h-0 px-0 py-0"
                onPress={onShowCommunity}
              >
                Все
              </Button>
            )
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-gutter gap-2 pb-1">
          {data.users.slice(0, COMMUNITY).map((t) => (
            <TemplateTile key={t.id} template={t} />
          ))}
          <Pressable
            accessibilityRole="link"
            onPress={() => router.dismissTo(ROUTES.PROGRAMS)}
            className="border-primary/60 bg-accent/40 active:bg-accent min-h-40 w-60 shrink-0 justify-between gap-3 border-[1.5px] border-dashed p-3"
          >
            <Icon as={Upload} className="text-primary size-6" />
            <Poster size="sm">Собрал свою? Покажи другим</Poster>
            <Text size="sm" tone="muted">
              В редакторе программы — блок «Каталог».
            </Text>
            <Eyebrow tone="primary">к моим программам →</Eyebrow>
          </Pressable>
        </ScrollView>
      </Rise>

      <Rise className="gap-3">
        <SectionHeading title="Все программы" aside={`${all.length} в каталоге`} />
        <View className="px-gutter gap-5">
          {all.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </View>
      </Rise>
    </>
  );
};
