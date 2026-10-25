import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useIsAuthenticated } from '@/shared/api';
import { ROUTES } from '@/shared/config/routes';

// Гость: с токеном здесь делать нечего — (app) сам уводит на «Сегодня»
const AuthGuard = () => {
  const isAuthenticated = useIsAuthenticated();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace(ROUTES.TODAY);
  }, [isAuthenticated, router, segments]);

  return null;
};

// Стек входа: экраны поверх сплэша, без шапки. Навигация «назад» — системная (Android) и жест (iOS)
export default function LayoutAuth() {
  return (
    <>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </>
  );
}
