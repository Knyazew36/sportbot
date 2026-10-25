import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';

import { useIsAuthenticated } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';

// Корень: с токеном — в приложение, без — на вход. Дальше (app) решает про онбординг
export default function Index() {
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    router.replace(isAuthenticated ? ROUTES.TODAY : ROUTES.LOGIN);
  }, [isAuthenticated]);

  return (
    <View className="bg-background flex-1 items-center justify-center">
      <ActivityIndicator colorClassName="accent-primary" size="large" />
    </View>
  );
}
