import type { SupportMessageReply, SupportTimelineMessage } from '@app/support-chat-client'

import { cx } from '../cx'
import { authorLabel } from '../format'
import type { SupportLocale } from '../locale'

export interface ReplyQuoteProps {
  reply: SupportMessageReply
  /** Чьи сообщения — «свои»: их автор подписывается «Вы». */
  ownAuthor: SupportTimelineMessage['author']
  locale: SupportLocale
  /** Переход к оригиналу; без него цитата — просто плашка (над полем ввода). */
  onClick?: () => void
  className?: string
}

/** Цитата сообщения, на которое ответили: автор и начало текста. */
export const ReplyQuote = ({ reply, ownAuthor, locale, onClick, className }: ReplyQuoteProps) => {
  const author = reply.author === ownAuthor ? locale.you : authorLabel(reply.author, reply.authorName, locale)
  const text = reply.deletedAt ? locale.deleted : reply.text || (reply.attachmentsCount > 0 ? locale.replyPhoto : '')

  const body = (
    <>
      <span className='scw:block scw:truncate scw:font-semibold'>{author}</span>
      <span className={cx('scw:block scw:truncate scw:opacity-80', reply.deletedAt && 'scw:italic')}>{text}</span>
    </>
  )
  const classes = cx(
    'scw:block scw:min-w-0 scw:rounded-md scw:border-l-[3px] scw:border-accent scw:px-2 scw:py-1 scw:text-left scw:text-xs scw:leading-4',
    className,
  )

  return onClick ? (
    <button
      type='button'
      className={cx(classes, 'scw:w-full scw:cursor-pointer')}
      onClick={onClick}
    >
      {body}
    </button>
  ) : (
    <div className={classes}>{body}</div>
  )
}
