import { BotChannel } from '@/generated/prisma/client';

import { AuthProvider } from '@/common/types/request-with-organization';

/** Мессенджер, из которого открыт Mini App; null — вход не через мессенджер (например, JWT кабинета). */
export const channelOf = (
  provider: AuthProvider | undefined,
): BotChannel | null => {
  if (provider === 'telegram') return 'TELEGRAM';
  if (provider === 'max') return 'MAX';
  return null;
};
