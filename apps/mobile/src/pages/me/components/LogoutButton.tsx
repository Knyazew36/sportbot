import { Button } from '@/shared/ui/kit/Button';

import { logout } from '@sportbot/api/entities/session';

// Выход: токен стёрт — гвард уводит на вход, кеш чистится по событию сессии (shared/api/query-client)
export const LogoutButton = () => <Button onPress={logout}>Выйти</Button>;
