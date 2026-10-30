import { useState } from 'react';
import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { TabView } from 'react-native-tab-view';

import {
  type CatalogKind,
  ENTRY_STATE_LABEL,
  type EntryState,
  entryState,
  type MyEntry,
  useMyEntries,
  usePublishEntry,
} from '@sportbot/api/entities/catalog';
import { routeHref, ROUTES } from '@/shared/config/routes';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/kit/Button';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { LoadMore } from '@/shared/ui/kit/LoadMore';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Text } from '@/shared/ui/kit/Typography';

const KIND_OPTIONS = [
  { value: 'exercise' as const, label: 'Упражнения' },
  { value: 'stretch' as const, label: 'Растяжки' },
] as const;

const ROUTES_CONFIG = KIND_OPTIONS.map(({ value, label }) => ({ key: value, title: label }));

const STATE_HINT: Partial<Record<EntryState, string>> = {
  PRIVATE: 'видна только тебе',
  PENDING: 'ждёт администратора',
  UNPUBLISHED: 'у тебя остаётся',
};

// Опубликовать можно личную, отклонённую и снятую — заявка уходит заново
const CAN_PUBLISH: EntryState[] = ['PRIVATE', 'REJECTED', 'UNPUBLISHED'];

const entryPath = (e: MyEntry) => {
  if (e.kind === 'exercise') return routeHref(ROUTES.EXERCISE, { exerciseId: e.id });
  return routeHref(ROUTES.STRETCH, { stretchId: e.id });
};

const EntriesList = ({ kind }: { kind: CatalogKind }) => {
  const entries = useMyEntries(kind);
  const publish = usePublishEntry();

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-gutter gap-4 pt-4 pb-8">
      <QueryState
        query={entries}
        isEmpty={(data) => !data.pages[0]?.items?.length}
        empty={{
          title: kind === 'exercise' ? 'Своих упражнений нет' : 'Своих растяжек нет',
          description: 'Не нашёл нужное в справочнике — добавь своё кнопкой ниже. Оно сразу доступно тебе.',
        }}
      >
        {(data) => (
          <View className="gap-4">
            <List>
              {data.pages
                .flatMap((page) => page.items ?? [])
                .map((e) => {
                  const state = entryState(e);
                  const hint = STATE_HINT[state];
                  return (
                    <ListRow
                      key={e.id}
                      title={e.name}
                      meta={`${ENTRY_STATE_LABEL[state]}${hint ? ` · ${hint}` : ''} · ${formatDate(e.createdAt, 'd MMMM')}`}
                    >
                      {e.reason && state !== 'PUBLISHED' && (
                        <Text size="sm" tone="soft" className="mt-2">
                          «{e.reason}»
                        </Text>
                      )}
                      <View className="mt-2 flex-row flex-wrap items-center gap-3">
                        <Button
                          variant="link"
                          size="sm"
                          onPress={() => router.push(entryPath(e))}
                          accessibilityLabel="Открыть"
                        >
                          Открыть
                        </Button>
                        {CAN_PUBLISH.includes(state) && (
                          <Button
                            size="sm"
                            variant="outline"
                            icon={Send}
                            loading={publish.isPending}
                            onPress={() => publish.mutate({ kind: e.kind, id: e.id })}
                          >
                            Опубликовать
                          </Button>
                        )}
                      </View>
                    </ListRow>
                  );
                })}
            </List>
            <LoadMore query={entries} />
          </View>
        )}
      </QueryState>
    </ScrollView>
  );
};

// Свои записи и их публикация в общий справочник (frontend-tz, 11.5).
// Вкладки «Упражнения»/«Растяжки» листаются свайпом, сегмент сверху — тот же TabView
export const MyEntries = () => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const kind = ROUTES_CONFIG[index].key as CatalogKind;

  return (
    <TabView
      style={{ flex: 1 }}
      navigationState={{ index, routes: ROUTES_CONFIG }}
      onIndexChange={setIndex}
      initialLayout={{ width }}
      renderScene={({ route }) => <EntriesList kind={route.key as CatalogKind} />}
      renderTabBar={() => (
        <View className="px-gutter">
          <Segmented options={KIND_OPTIONS} value={kind} onValueChange={(k) => setIndex(k === 'exercise' ? 0 : 1)} stretch />
        </View>
      )}
    />
  );
};
