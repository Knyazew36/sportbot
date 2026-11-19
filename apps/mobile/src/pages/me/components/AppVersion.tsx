import { View } from 'react-native';
import Constants from 'expo-constants';

import { Text } from '@/shared/ui/kit/Typography';

// Версия из app.config.ts (поле version) — единственный источник, руками здесь не правим.
// В dev/preview-сборках добавляем имя варианта, чтобы не путать с боевым приложением
const VARIANT_LABEL: Record<string, string> = { development: 'dev', preview: 'preview' };

export const AppVersion = () => {
  const version = Constants.expoConfig?.version;
  if (!version) return null;

  const variant = VARIANT_LABEL[String(Constants.expoConfig?.extra?.variant ?? '')];

  return (
    <View className="items-center">
      <Text size="xs" tone="muted">
        Версия {version}
        {variant ? ` · ${variant}` : ''}
      </Text>
    </View>
  );
};
