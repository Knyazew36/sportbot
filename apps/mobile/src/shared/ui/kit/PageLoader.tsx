import { ActivityIndicator, View } from 'react-native';

// Полноэкранное ожидание — порт shared/ui/kit/PageLoader.tsx: первая загрузка и получение профиля
export const PageLoader = () => (
  <View accessibilityLabel="Загрузка" accessibilityState={{ busy: true }} className="bg-background flex-1 items-center justify-center">
    <ActivityIndicator size="small" colorClassName="accent-smoke" />
  </View>
);
