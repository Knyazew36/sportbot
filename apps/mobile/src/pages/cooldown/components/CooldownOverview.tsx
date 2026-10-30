import { router } from 'expo-router';
import { ArrowRight, Plus } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { toAssetUrl } from '@/shared/api';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Icon } from '@/shared/ui/kit/Icon';
import { List } from '@/shared/ui/kit/ListRow';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import { CatalogRow } from '@/widgets/catalog/CatalogRow';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownRoutines } from './CooldownRoutines';
import { CooldownAddSheet, CooldownDetailSheet } from './CooldownSheets';

// Обзор перед стартом: сколько минут и какие растяжки в основном блоке и «если есть время»
export const CooldownOverview = ({ flow }: { flow: CooldownFlow }) => {
  const { cooldown } = flow;
  const blocks = [
    { title: 'Основной блок', list: cooldown.main },
    { title: 'Если есть время', list: cooldown.optional },
  ].filter((b) => b.list.length);

  return (
    <Screen
      fullscreen
      header={<TopBar back={() => router.replace(flow.back)} title="Заминка" subtitle={`~${cooldown.minutes} мин`} />}
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
      <Rise>
        <Lead>растяжка на отработавшие мышцы —</Lead>
        <Poster size="display" tone="primary">
          {`~${cooldown.minutes} мин`}
        </Poster>
      </Rise>
      {blocks.map((block) => (
        <ScreenSection
          key={block.title}
          title={block.title}
          aside={pluralize(block.list.length, STRETCH_FORMS)}
        >
          <List>
            {block.list.map((s) => (
              <CatalogRow
                key={s.id}
                name={s.name}
                imageUrl={toAssetUrl(s.imageUrl) ?? null}
                meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                onPress={() => flow.open(s)}
              />
            ))}
          </List>
        </ScreenSection>
      ))}
      <Rise>
        <Button variant="outline" className="self-start" icon={Plus} onPress={() => flow.setAddOpen(true)}>
          Добавить растяжку
        </Button>
      </Rise>
      <CooldownRoutines flow={flow} />
      <CooldownDetailSheet flow={flow} />
      <CooldownAddSheet flow={flow} />
    </Screen>
  );
};
