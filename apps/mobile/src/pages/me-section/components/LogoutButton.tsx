import { logout } from '@sportbot/api/entities/session';

import { Button } from '@/shared/ui/kit/Button';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';

// Выход: токен стёрт — гвард уводит на вход, кеш чистится по событию сессии (shared/api/query-client)
export const LogoutButton = () => (
  <ScreenSection>
    <Button variant="outline" block onPress={logout}>
      Выйти
    </Button>
  </ScreenSection>
);
