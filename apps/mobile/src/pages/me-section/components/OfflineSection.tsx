import { View } from 'react-native';

import { pluralize } from '@front-cmdt/utils/pluralize';
import { count } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ImageDown, RefreshCw } from 'lucide-react-native';

import { type LocalDb, META_KEYS, useLocalDb, useMetaValue } from '@/shared/db';
import { exercises, stretches } from '@/shared/db/schema';
import { formatDateTime } from '@/shared/lib/format';
import { EXERCISE_FORMS, STRETCH_FORMS } from '@/shared/lib/plural-forms';
import { runSync, useSyncStatus } from '@/shared/sync';
import { clearIssues } from '@/shared/sync/apply-push';
import { useWorkoutSync } from '@/shared/local/entities/workout';
import { Button } from '@/shared/ui/kit/Button';
import { Notice } from '@/shared/ui/kit/Notice';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Text } from '@/shared/ui/kit/Typography';

import { ISSUES_SHOWN, parseIssues, SYNC_PHASE_LABEL } from '../model/offline';
import { useOfflineMedia } from '../model/use-offline-media';

const SyncBlock = ({ db }: { db: LocalDb }) => {
  const status = useSyncStatus();
  const syncedAt = useMetaValue(db, META_KEYS.syncedAt);
  const issuesRaw = useMetaValue(db, META_KEYS.issues);
  const issues = parseIssues(issuesRaw);
  const { pending } = useWorkoutSync();

  return (
    <View className="gap-2">
      <Notice
        kicker={SYNC_PHASE_LABEL[status.phase]}
        title={syncedAt ? 'Данные на телефоне' : 'Ещё не скачано'}
        description={[
          syncedAt ? `Последний обмен — ${formatDateTime(syncedAt)}` : 'Нужен интернет для первой загрузки',
          pending ? `Ждут отправки: ${pending}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        action={
          <Button size="sm" icon={RefreshCw} loading={status.phase === 'syncing'} onPress={() => void runSync(db)}>
            Обновить
          </Button>
        }
      />
      {status.phase === 'error' && status.error ? (
        <Text size="sm" tone="soft">
          {status.error}
        </Text>
      ) : null}
      {issues.length ? (
        <Notice
          kicker="не применилось"
          title={`Сервер не принял: ${issues.length}`}
          description={issues
            .slice(0, ISSUES_SHOWN)
            .map((i) => i.reason)
            .join('\n')}
          action={
            <Button size="sm" variant="outline" onPress={() => clearIssues(db)}>
              Понятно
            </Button>
          }
        />
      ) : null}
    </View>
  );
};

const MediaBlock = ({ db }: { db: LocalDb }) => {
  const mediaAt = useMetaValue(db, META_KEYS.mediaAt);
  const { data: exerciseCount } = useLiveQuery(db.select({ n: count() }).from(exercises));
  const { data: stretchCount } = useLiveQuery(db.select({ n: count() }).from(stretches));
  const { progress, start, cancel } = useOfflineMedia(db);
  const empty = !exerciseCount[0]?.n;

  return (
    <View className="gap-3">
      <Text tone="soft">
        {empty
          ? 'Справочник появится после первой синхронизации.'
          : `В справочнике ${pluralize(exerciseCount[0]?.n ?? 0, EXERCISE_FORMS)} и ${pluralize(stretchCount[0]?.n ?? 0, STRETCH_FORMS)}. ${
              mediaAt ? `Картинки скачаны ${formatDateTime(mediaAt)}.` : 'Картинки без сети не покажутся, пока их не скачать.'
            }`}
      </Text>
      {progress ? (
        <View className="gap-2">
          <Text size="sm">
            Скачано {progress.done} из {progress.total}
          </Text>
          <Button variant="outline" block onPress={cancel}>
            Остановить
          </Button>
        </View>
      ) : (
        <Button variant="outline" block icon={ImageDown} disabled={empty} onPress={start}>
          {mediaAt ? 'Докачать картинки' : 'Скачать картинки справочника'}
        </Button>
      )}
    </View>
  );
};

// Офлайн-режим: что лежит на телефоне, когда был обмен с сервером, картинки справочника для зала без сети
export const OfflineSection = () => {
  const db = useLocalDb();

  return (
    <ScreenSection className="gap-6">
      {db ? (
        <>
          <SyncBlock db={db} />
          <MediaBlock db={db} />
        </>
      ) : (
        <Text tone="soft">Локальная база ещё открывается.</Text>
      )}
    </ScreenSection>
  );
};
