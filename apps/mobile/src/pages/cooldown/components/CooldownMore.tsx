import { ArrowRight } from 'lucide-react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { toAssetUrl } from '@/shared/api';
import { STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { List } from '@/shared/ui/kit/ListRow';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Lead, Poster } from '@/shared/ui/kit/Typography';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownAdd } from './CooldownAdd';
import { CooldownDetailSheet } from './CooldownSheets';

// Развилка после основного блока и в самом конце: продолжить, добавить ещё или закончить
export const CooldownMore = ({ flow }: { flow: CooldownFlow }) => {
  const { cooldown, done, remaining, remainingMinutes } = flow;
  const hasMore = remaining.length > 0;
  // Из списка можно перепрыгнуть вперёд: тогда «основной блок пройден» было бы неправдой
  const mainLeft = cooldown.main.some((s) => !done.has(s.id));

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          back={flow.finish}
          title="Заминка"
          subtitle={mainLeft ? 'есть пропущенные' : hasMore ? 'основной блок пройден' : 'все растяжки пройдены'}
        />
      }
      footer={
        <StickyFooter>
          <Button variant={hasMore ? 'outline' : 'default'} size="lg" onPress={flow.finish}>
            Завершить
          </Button>
          {hasMore && (
            <Button size="lg" onPress={flow.resume}>
              Продолжить
              <Icon as={ArrowRight} className="size-7" strokeWidth={2.5} />
            </Button>
          )}
        </StickyFooter>
      }
      className="px-gutter"
    >
      <Rise>
        <Lead>{hasMore ? 'есть время ещё —' : 'заминка пройдена —'}</Lead>
        <Poster size="display" tone="primary" className="mt-1">
          {hasMore ? `на ~${remainingMinutes} мин?` : 'ещё?'}
        </Poster>
      </Rise>
      {hasMore && (
        <ScreenSection title="Дальше" aside={pluralize(remaining.length, STRETCH_FORMS)}>
          <List>
            {remaining.map((s) => (
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
      )}
      <ScreenSection title="Добавить растяжку">
        <CooldownAdd flow={flow} />
      </ScreenSection>
      <CooldownDetailSheet flow={flow} />
    </Screen>
  );
};
