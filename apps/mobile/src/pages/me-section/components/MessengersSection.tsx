import { Linking, View } from 'react-native';
import { Link } from 'lucide-react-native';

import {
  type Messenger,
  MESSENGER_LABEL,
  useCreateLinkCode,
  useLinkState,
  useSetNotify,
  useUnlink,
} from '@sportbot/api/entities/link';

import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

const ALL: Messenger[] = ['TELEGRAM', 'MAX'];
const BOTH = 'BOTH';

const NOTIFY_OPTIONS = [
  { value: 'TELEGRAM', label: 'Telegram' },
  { value: 'MAX', label: 'MAX' },
  { value: BOTH, label: 'Оба' },
];

// Мессенджеры — порт pages/me-section/components/MessengersSection.tsx: привязка второго по одноразовой
// ссылке, отвязка, куда слать вопросы
export const MessengersSection = () => {
  const state = useLinkState();
  const code = useCreateLinkCode();
  const unlink = useUnlink();
  const notify = useSetNotify();
  const linked = state.data?.linked ?? [];
  const notifyValue = state.data?.notify.length === 2 ? BOTH : (state.data?.notify[0] ?? '');

  return (
    <ScreenSection>
      <List>
        {ALL.map((m) => {
          const isLinked = linked.includes(m);
          return (
            <ListRow
              key={m}
              title={MESSENGER_LABEL[m]}
              meta={isLinked ? 'привязан' : 'не привязан'}
              trail={
                isLinked ? (
                  // Отвязать можно, только пока остаётся второй — иначе это удаление аккаунта
                  linked.length > 1 ? (
                    <ConfirmAction
                      trigger={<Button variant="outline" size="xs" />}
                      title={`Отвязать ${MESSENGER_LABEL[m]}?`}
                      description="Чат с ботом там начнётся с нуля. История останется в аккаунте."
                      confirmLabel="Отвязать"
                      onConfirm={() => unlink.mutateAsync(m)}
                    >
                      Отвязать
                    </ConfirmAction>
                  ) : (
                    <Badge>привязан</Badge>
                  )
                ) : state.data?.available.includes(m) ? (
                  <Button variant="outline" size="xs" icon={Link} loading={code.isPending} onPress={() => code.mutate()}>
                    Привязать
                  </Button>
                ) : undefined
              }
            />
          );
        })}
      </List>
      {linked.length > 1 && (
        <View className="gap-2">
          <Text size="sm" tone="soft">
            Куда присылать вопросы и напоминания
          </Text>
          <Segmented
            options={NOTIFY_OPTIONS}
            value={notifyValue}
            onValueChange={(v) => notify.mutate(v === BOTH ? ALL : [v as Messenger])}
            stretch
          />
        </View>
      )}

      {/* Привязка второго мессенджера: одноразовая ссылка на бота, как в боте (business-tz, 22.4) */}
      <Sheet
        open={code.data != null}
        onOpenChange={(open) => !open && code.reset()}
        title={`Привязать ${code.data ? MESSENGER_LABEL[code.data.channel] : ''}`}
        description="Открой ссылку и нажми «Старт» у бота — аккаунты объединятся, история останется одна."
      >
        <View className="gap-3 pb-2">
          {code.data && (
            // Ссылка на бота — системой, а не встроенным браузером: так сразу откроется приложение мессенджера
            <Button size="lg" block onPress={() => code.data && void Linking.openURL(code.data.url)}>
              {`Открыть ${MESSENGER_LABEL[code.data.channel]}`}
            </Button>
          )}
          <Text size="xs" tone="muted">
            Ссылка одноразовая и действует 15 минут.
          </Text>
          <Button
            variant="outline"
            block
            onPress={() => {
              code.reset();
              void state.refetch();
            }}
          >
            Готово
          </Button>
        </View>
      </Sheet>
    </ScreenSection>
  );
};
