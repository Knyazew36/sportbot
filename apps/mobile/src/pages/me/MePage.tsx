import { View } from 'react-native';

import { useMe } from '@sportbot/api/entities/session';

import { PALETTES } from '@/features/change-theme/options';
import { Screen } from '@/shared/ui/kit/Screen';
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Text } from '@/shared/ui/kit/Typography';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { AccountCard } from './components/AccountCard';
import { DeleteAccountSection } from './components/DeleteAccountSection';
import { LogoutButton } from './components/LogoutButton';

// Профиль: карта участника, оформление, выход и удаление аккаунта — порт pages/me.
// Остальные разделы профиля (расписание, таймеры, поддержка) — этап 2
const MePage = () => {
  const me = useMe();
  const { palette, setPalette } = useTheme();

  return (
    <Screen header={<ScreenHeader title="Профиль" />}>
      <QueryState query={me}>
        {(user) => (
          <View className="gap-6">
            <AccountCard user={user} />

            <View className="px-gutter gap-2">
              <Text size="sm" tone="soft">
                Оформление
              </Text>
              <Segmented options={PALETTES} value={palette} onValueChange={setPalette} stretch />
              <Text size="xs" tone="muted">
                Тема — как в системе телефона
              </Text>
            </View>

            <LogoutButton />
            <DeleteAccountSection hasPassword={!!user.email} />
          </View>
        )}
      </QueryState>
    </Screen>
  );
};

export default MePage;
