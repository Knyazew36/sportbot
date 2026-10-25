import { useState } from 'react';
import { router } from 'expo-router';
import { Send } from 'lucide-react-native';
import { View } from 'react-native';

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
import { Rise } from '@/shared/ui/kit/Reveal';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Text } from '@/shared/ui/kit/Typography';

const KIND_OPTIONS = [
  { value: 'exercise' as const, label: 'Упражнения' },
  { value: 'stretch' as const, label: 'Растяжки' },
] as const;

const STATE_HINT: Partial<Record<EntryState, string>> = {
  PRIVATE: 'видна только тебе',
  PENDING: 'ждёт администратора',
  UNPUBLISHED: 'у тебя остаётся',
};

// Опубликовать можно личную, отклонённую и снятую — заявка уходит заново
const CAN_PUBLISH: EntryState[] = ['PRIVATE', 'REJECTED', 'UNPUBLISHED'];

const entryPath = (e: MyEntry) =>
  e.kind === 'exercise'
    ? routeHref(ROUTES.EXERCISE, { exerciseId: e.id })
    : routeHref(ROUTES.STRETCH, { stretchId: e.id });

// Вкладка «Мои»: свои записи и их публикация в общий справочник (frontend-tz, 11.5)
export const MineTab = () => {
  const [kind, setKind] = useState<CatalogKind>('exercise');
  const entries = useMyEntries(kind);
  const publish = usePublishEntry();

  return (
    <Rise className="px-gutter gap-4">
      <Segmented options={KIND_OPTIONS} value={kind} onValueChange={setKind} stretch />
      <QueryState
        query={entries}
        isEmpty={(data) => !data.pages[0]?.items?.length}
        empty={{
          title: kind === 'exercise' ? 'Своих упражнений нет' : 'Своих растяжек нет',
          description: 'Не нашёл нужное в справочнике — добавь своё кнопками ниже. Оно сразу доступно тебе.',
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
    </Rise>
  );
};
