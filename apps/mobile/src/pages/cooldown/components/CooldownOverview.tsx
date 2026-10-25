import { View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { toAssetUrl } from '@/shared/api';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { CatalogImage } from '@/shared/ui/kit/CatalogImage';
import { Icon } from '@/shared/ui/kit/Icon';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownDetailSheet } from './CooldownSheets';

// Обзор перед стартом: сколько минут и какие растяжки в основном блоке и «если есть время"
export const CooldownOverview = ({ flow }: { flow: CooldownFlow }) => {
  const { cooldown } = flow;
  const blocks = [
    { title: 'Основной блок', list: cooldown.main },
    { title: 'Если есть время', list: cooldown.optional },
  ].filter((b) => b.list.length);

  return (
    <Screen
      fullscreen
      header={
        <View className="px-gutter flex-row items-center gap-3 py-2">
          <View className="min-w-0 flex-1">
            <Poster size="sm" numberOfLines={1}>
              Заминка
            </Poster>
            <Lead size="sm" tone="muted" numberOfLines={1}>
              ~{cooldown.minutes} мин
            </Lead>
          </View>
        </View>
      }
      footer={
        <StickyFooter>
          <ButtonLink href={flow.back} replace variant="outline" size="lg">
            Пропустить
          </ButtonLink>
          <Button size="lg" onPress={() => flow.go(0)}>
            Начать
            <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
          </Button>
        </StickyFooter>
      }
      className="px-gutter"
    >
      <View>
        <Lead>растяжка на отработавшие мышцы —</Lead>
        <Poster size="display" tone="primary" numeric>
          ~{cooldown.minutes} мин
        </Poster>
      </View>
      {blocks.map((block) => (
        <ScreenSection
          key={block.title}
          title={block.title}
          aside={pluralize(block.list.length, STRETCH_FORMS)}
        >
          <List>
            {block.list.map((s) => (
              <ListRow
                key={s.id}
                lead={<CatalogImage src={toAssetUrl(s.imageUrl) ?? null} alt={s.name} />}
                title={s.name}
                meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                onPress={() => flow.open(s)}
              />
            ))}
          </List>
        </ScreenSection>
      ))}
      <CooldownDetailSheet flow={flow} />
    </Screen>
  );
};
