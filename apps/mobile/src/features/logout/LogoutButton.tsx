import { logout } from '@sportbot/api/entities/session';
import { useWorkoutSync } from '@/shared/local/entities/workout';

import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';

// Выход: токен стёрт — гвард уводит на вход, кеш чистится по событию сессии (shared/api/query-client).
// Неотправленные правки лежат в базе этого аккаунта на телефоне и уйдут после входа им же —
// предупреждаем, чтобы не ждали их на сервере раньше
export const LogoutButton = () => {
  const { pending } = useWorkoutSync();

  return (
    <ScreenSection>
      {pending > 0 ? (
        <ConfirmAction
          trigger={<Button variant="outline" block />}
          title="Выйти, не отправив правки?"
          description={`Не отправлено на сервер: ${pending}. Они останутся на телефоне и уйдут, когда вы снова войдёте этим аккаунтом.`}
          confirmLabel="Выйти"
          onConfirm={logout}
        >
          Выйти
        </ConfirmAction>
      ) : (
        <Button variant="outline" block onPress={logout}>
          Выйти
        </Button>
      )}
    </ScreenSection>
  );
};
