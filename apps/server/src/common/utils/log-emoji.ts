// Эмодзи-префикс по сущности — для быстрого визуального грепа логов по домену.
// Статусные эмодзи (⏰✅❌⚠️ и т.п.) остаются рядом, это разные оси: сущность vs исход.
export const ENTITY_EMOJI = {
  auth: '🔐',
  user: '👤',
  organization: '🏢',
  group: '👥',
  lesson: '📚',
  scheduleRule: '🗓️',
  joinRequest: '🙋',
  invite: '📨',
  admin: '🛠️',
  vk: '🤖',
  mail: '✉️',
  upload: '📁',
  notification: '🔔',
  botMax: '🤖max',
  chat: '💬',
} as const;

const URL_SEGMENT_EMOJI: Record<string, string> = {
  auth: ENTITY_EMOJI.auth,
  user: ENTITY_EMOJI.user,
  organization: ENTITY_EMOJI.organization,
  group: ENTITY_EMOJI.group,
  lesson: ENTITY_EMOJI.lesson,
  'schedule-rule': ENTITY_EMOJI.scheduleRule,
  'join-request': ENTITY_EMOJI.joinRequest,
  invite: ENTITY_EMOJI.invite,
  admin: ENTITY_EMOJI.admin,
  vk: ENTITY_EMOJI.vk,
  upload: ENTITY_EMOJI.upload,
  'chat-submission': ENTITY_EMOJI.chat,
};

const UNKNOWN_ENTITY_EMOJI = '⚙️';

/** Эмодзи сущности по первому сегменту пути после /api/ (например /api/products/123 → 📦). */
export function resolveEntityEmoji(url: string): string {
  const segment = url
    .replace(/^\/?api\/?/, '')
    .split('/')[0]
    ?.split('?')[0];
  return (segment && URL_SEGMENT_EMOJI[segment]) || UNKNOWN_ENTITY_EMOJI;
}
