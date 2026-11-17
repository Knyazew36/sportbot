import type { SupportConversation, SupportMessage, SupportSide } from './types'

/** Неймспейс socket.io чата поддержки. */
export const SUPPORT_SOCKET_NAMESPACE = '/support'

/** HTTP-заголовок с токеном визита. Не Authorization — он занят авторизацией проекта. */
export const SUPPORT_VISIT_HEADER = 'x-support-visit'

/**
 * События сервер → клиент. Сокет — только подсказка «что-то изменилось»: событие может потеряться
 * при обрыве, поэтому после переподключения и при пропуске в seq клиент добирает сообщения REST-запросом.
 * У посетителя пропуски в seq бывают и законно — это заметки операторов: один добор afterSeq, и пропуск принят.
 */
export interface SupportServerToClientEvents {
  'message.created': (payload: { message: SupportMessage }) => void
  'message.updated': (payload: { message: SupportMessage }) => void
  'message.deleted': (payload: { message: SupportMessage }) => void
  'conversation.updated': (payload: { conversation: SupportConversation }) => void
  'conversation.deleted': (payload: { conversationId: number }) => void
  'conversation.read': (payload: { conversationId: number; side: SupportSide; seq: number }) => void
  typing: (payload: { conversationId: number; side: SupportSide; name: string | null }) => void
  /** Сколько операторов сейчас онлайн. */
  presence: (payload: { operatorsOnline: number }) => void
}

/** События клиент → сервер. Только эфемерное: всё, что сохраняется, идёт через REST. */
export interface SupportClientToServerEvents {
  /** internal — оператор пишет заметку: видят только коллеги, клиенту не уходит. */
  typing: (payload: { conversationId: number; internal?: boolean }) => void
}

/**
 * Что клиент передаёт в handshake.auth: посетитель — токен визита, оператор — значение заголовка
 * Authorization проекта целиком (`Bearer …`, `tma …`), сервер проверяет его теми же стратегиями.
 */
export interface SupportSocketAuth {
  visitToken?: string
  authorization?: string
}
