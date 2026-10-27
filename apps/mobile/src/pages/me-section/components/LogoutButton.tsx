import { logout } from '@sportbot/api/entities/session';
import { useWorkoutSync } from '@sportbot/api/entities/workout';

import { Button } from '@/shared/ui/kit/Button';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';

// Выход: токен стёрт — гвард уводит на вход, кеш чистится по событию сессии (shared/api/query-client).
// Вместе с кешем уходит и неотправленная очередь — поэтому с ней выход только после подтверждения
export const LogoutButton = () => {
  const { pending } = useWorkoutSync();

  return (
    <ScreenSection>
      {pending > 0 ? (
        <ConfirmAction
          trigger={<Button variant="outline" block />}
          title="Выйти без сохранения?"
          description={`Не отправлено на сервер: ${pending}. После выхода эти данные пропадут. Подключитесь к интернету и дождитесь отправки.`}
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
