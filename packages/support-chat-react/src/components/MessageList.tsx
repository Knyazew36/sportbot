import type { SupportMessageReply, SupportTimelineMessage } from '@app/support-chat-client'

import {
  Fragment,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cx } from '../cx'
import { authorLabel, dayKey, formatDay, formatTime, resolveUrl } from '../format'
import { AlertIcon, BotIcon, CheckCheckIcon, CheckIcon, ClockIcon, HeadsetIcon, PencilIcon, ReplyIcon } from '../icons'
import type { SupportLocale } from '../locale'
import { spinner } from '../ui'

import { Avatar } from './Avatar'
import { Lightbox, type LightboxItem } from './Lightbox'
import { ReplyQuote } from './ReplyQuote'

export interface MessageListProps {
  messages: SupportTimelineMessage[]
  /** Чьи сообщения — «свои» (справа): посетителю — CONTACT, оператору — OPERATOR. */
  ownAuthor: 'CONTACT' | 'OPERATOR'
  /** До какого seq прочитала другая сторона — для двойной галочки. */
  otherReadSeq: number
  /** Первая загрузка ленты — пока сообщений нет, вместо них крутилка. */
  loading?: boolean
  hasMoreBefore: boolean
  loadingOlder: boolean
  onLoadOlder: () => void
  onRetry: (key: string) => void
  onDiscard: (key: string) => void
  /** Ответить на сообщение: кнопка при наведении и свайп влево на телефоне. */
  onReply?: (message: SupportTimelineMessage) => void
  /** Изменить своё сообщение (оператору): кнопка-карандаш при наведении. */
  onEdit?: (message: SupportTimelineMessage) => void
  /** Какие из «своих» можно править — сервер разрешает только сообщения самого оператора, не коллег. */
  canEdit?: (message: SupportTimelineMessage) => boolean
  /** Догрузить историю до seq, чтобы перейти к цитате. false — не нашлось. */
  onRevealSeq?: (seq: number) => Promise<boolean>
  assetBaseUrl?: string
  locale: SupportLocale
  /** Строка под лентой: «печатает…». */
  footer?: ReactNode
  /** Показывать подпись автора у чужих сообщений (оператору — кто из коллег ответил). */
  showAuthorNames?: boolean
  /** Аватарки у чужих сообщений. По умолчанию — да. */
  showAvatars?: boolean
  /** Имя клиента для его аватарки (в инбоксе оператора). */
  contactName?: string
  empty?: ReactNode
  className?: string
}

/** Насколько близко к низу считаем «пользователь читает последнее» — тогда докручиваем к новым. */
const STICK_TO_BOTTOM_PX = 120
const LOAD_OLDER_AT_PX = 80
/** Свайп влево: с какого сдвига ответить и дальше какого не тянуть. */
const SWIPE_REPLY_PX = 56
const SWIPE_MAX_PX = 80
const FLASH_MS = 1600

const centerNote = 'scw:my-2 scw:self-center scw:text-center scw:text-xs scw:text-muted'
const dayPill = 'scw:mt-3 scw:mb-2 scw:self-center scw:text-2xs scw:font-medium scw:tracking-[0.02em] scw:text-muted'

const groupKey = (message: SupportTimelineMessage) => `${message.author}:${message.authorId ?? ''}`
const fileKey = (message: SupportTimelineMessage, fileId: number) => `${message.key}:${fileId}`

export const MessageList = (props: MessageListProps) => {
  const { messages, locale, showAvatars = true } = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const anchor = useRef({ firstKey: '', lastKey: '', scrollHeight: 0, nearBottom: true })
  const [viewing, setViewing] = useState<number | null>(null)
  const [flashId, setFlashId] = useState<number | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current)
    },
    [],
  )

  // Все картинки диалога по порядку — галерея листает их подряд, а не только внутри одного сообщения
  const gallery = useMemo<LightboxItem[]>(
    () =>
      messages.flatMap(message =>
        message.deletedAt
          ? []
          : message.attachments
              .filter(file => file.mime.startsWith('image/'))
              .map(file => ({
                key: fileKey(message, file.id),
                url: resolveUrl(file.url, props.assetBaseUrl),
                name: file.name,
              })),
      ),
    [messages, props.assetBaseUrl],
  )

  // Догрузили историю сверху — сохраняем позицию; пришло новое снизу — докручиваем, если читали низ
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const previous = anchor.current
    const firstKey = messages[0]?.key ?? ''
    const last = messages[messages.length - 1]

    if (previous.firstKey && firstKey !== previous.firstKey && last?.key === previous.lastKey) {
      element.scrollTop += element.scrollHeight - previous.scrollHeight
    } else if (last && last.key !== previous.lastKey && (previous.nearBottom || last.author === props.ownAuthor)) {
      element.scrollTop = element.scrollHeight
    }
    anchor.current = { ...anchor.current, firstKey, lastKey: last?.key ?? '', scrollHeight: element.scrollHeight }
  }, [messages, props.ownAuthor])

  const onScroll = () => {
    const element = scrollRef.current
    if (!element) return
    anchor.current.nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_TO_BOTTOM_PX
    anchor.current.scrollHeight = element.scrollHeight
    if (element.scrollTop < LOAD_OLDER_AT_PX && props.hasMoreBefore && !props.loadingOlder) props.onLoadOlder()
  }

  const findRow = (id: number) => scrollRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`)

  // Оригинал может быть выше загруженного — сначала догружаем историю до его seq
  const jumpTo = async (reply: SupportMessageReply) => {
    let row = findRow(reply.id)
    if (!row && props.onRevealSeq) {
      if (!(await props.onRevealSeq(reply.seq))) return
      await new Promise(resolve => requestAnimationFrame(resolve))
      row = findRow(reply.id)
    }
    if (!row) return
    row.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setFlashId(reply.id)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashId(null), FLASH_MS)
  }

  const openImage = (key: string) => {
    const index = gallery.findIndex(item => item.key === key)
    if (index >= 0) setViewing(index)
  }

  const avatarOf = (message: SupportTimelineMessage) => {
    if (message.author === 'BOT') {
      return (
        <Avatar
          name={locale.support}
          icon={
            <BotIcon
              width={20}
              height={20}
            />
          }
          size='md'
        />
      )
    }
    if (message.author === 'CONTACT') {
      return (
        <Avatar
          name={props.contactName ?? locale.visitor}
          size='md'
        />
      )
    }
    // У оператора всегда гарнитура, имя — только в подсказке и для цвета
    return (
      <Avatar
        name={message.authorName ?? locale.operator}
        icon={
          <HeadsetIcon
            width={20}
            height={20}
          />
        }
        size='md'
      />
    )
  }

  return (
    <div
      ref={scrollRef}
      className={cx(
        // overflow-x-hidden — значок ответа при свайпе выезжает из-за края и не должен давать прокрутку вбок.
        // scrollbar-gutter — место под полосу прокрутки занято сразу: появилась полоса — пузыри не сдвигаются вбок.
        // overflow-anchor: none — позицию при догрузке истории держим сами, иначе браузер сдвинет ещё раз
        'scw:flex scw:min-h-0 scw:flex-1 scw:flex-col scw:gap-1 scw:overflow-x-hidden scw:overflow-y-auto scw:overscroll-contain scw:p-4 scw:[overflow-anchor:none] scw:[scrollbar-gutter:stable] scw:[scrollbar-width:thin]',
        props.className,
      )}
      onScroll={onScroll}
      role='log'
      aria-live='polite'
    >
      {/* Прижимает сообщения к низу, как в мессенджерах: пока их мало, они растут снизу вверх, а не прыгают, когда начинается прокрутка */}
      <div
        className='scw:mt-auto'
        aria-hidden
      />
      {props.loadingOlder && (
        <div className={cx(centerNote, 'scw:inline-flex scw:items-center scw:gap-2')}>
          <span className={cx(spinner, 'scw:size-3.5')} />
          {locale.loadOlder}
        </div>
      )}
      {messages.length === 0 &&
        (props.loading ? (
          <div
            className='scw:flex scw:flex-1 scw:flex-col scw:items-center scw:justify-center scw:gap-3 scw:text-sm scw:text-muted'
            role='status'
          >
            <span className={cx(spinner, 'scw:size-7 scw:border-[3px]')} />
            {locale.loading}
          </div>
        ) : (
          props.empty
        ))}
      {messages.map((message, index) => {
        const previous = messages[index - 1]
        const next = messages[index + 1]
        const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
        const own = message.author === props.ownAuthor
        const firstInGroup = newDay || !previous || groupKey(previous) !== groupKey(message)
        // Аватарка — у последнего сообщения серии, как в мессенджерах
        const lastInGroup =
          !next || groupKey(next) !== groupKey(message) || dayKey(next.createdAt) !== dayKey(message.createdAt)

        return (
          <Fragment key={message.key}>
            {newDay && <div className={dayPill}>{formatDay(message.createdAt, locale)}</div>}
            {message.author === 'SYSTEM' ? (
              <div className={cx(centerNote, 'scw:max-w-[80%] scw:rounded-full scw:bg-surface scw:px-2.5 scw:py-1')}>
                {message.text}
              </div>
            ) : (
              <MessageRow
                message={message}
                own={own}
                flash={flashId === message.id}
                className={lastInGroup ? 'scw:mb-1.5' : undefined}
                // Ответить можно только на подтверждённое: у неотправленного ещё нет id на сервере
                onReply={
                  props.onReply && message.localStatus === 'sent' && !message.deletedAt ? props.onReply : undefined
                }
                // Править можно только текст: пустое сообщение с картинками сервер не примет
                onEdit={
                  props.onEdit &&
                  own &&
                  message.localStatus === 'sent' &&
                  !message.deletedAt &&
                  message.text &&
                  (props.canEdit?.(message) ?? true)
                    ? props.onEdit
                    : undefined
                }
                locale={locale}
              >
                <MessageBubble
                  message={message}
                  own={own}
                  avatar={
                    !own && showAvatars ? (
                      <div className='scw:w-10 scw:flex-none'>{lastInGroup && avatarOf(message)}</div>
                    ) : null
                  }
                  ownAuthor={props.ownAuthor}
                  lastInGroup={lastInGroup}
                  showAuthor={!!props.showAuthorNames && !own && firstInGroup}
                  read={message.localStatus === 'sent' && message.seq <= props.otherReadSeq}
                  onRetry={props.onRetry}
                  onDiscard={props.onDiscard}
                  onOpenImage={openImage}
                  onJumpTo={reply => void jumpTo(reply)}
                  assetBaseUrl={props.assetBaseUrl}
                  locale={locale}
                />
              </MessageRow>
            )}
          </Fragment>
        )
      })}
      {props.footer}
      {viewing !== null && gallery[viewing] && (
        <Lightbox
          items={gallery}
          index={viewing}
          onIndexChange={setViewing}
          onClose={() => setViewing(null)}
          locale={locale}
        />
      )}
    </div>
  )
}

interface MessageRowProps {
  message: SupportTimelineMessage
  own: boolean
  /** Подсветить: к сообщению только что перешли по цитате. */
  flash: boolean
  onReply?: (message: SupportTimelineMessage) => void
  onEdit?: (message: SupportTimelineMessage) => void
  locale: SupportLocale
  className?: string
  children: ReactNode
}

/** Строка ленты: кнопки «Ответить» и «Изменить» при наведении, на телефоне — свайп влево для ответа. */
const MessageRow = ({ message, own, flash, onReply, onEdit, locale, className, children }: MessageRowProps) => {
  const [offset, setOffset] = useState(0)
  const swipe = useRef<{ x: number; y: number; horizontal: boolean | null; offset: number } | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onReply || event.pointerType !== 'touch') return
    swipe.current = { x: event.clientX, y: event.clientY, horizontal: null, offset: 0 }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = swipe.current
    if (!current) return
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    // Направление решаем по первым пикселям: вертикальный жест — прокрутка ленты, его не трогаем
    if (current.horizontal === null && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      current.horizontal = Math.abs(dx) > Math.abs(dy) && dx < 0
    }
    if (!current.horizontal) return
    current.offset = Math.max(-SWIPE_MAX_PX, Math.min(0, dx))
    setOffset(current.offset)
  }

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const current = swipe.current
    swipe.current = null
    if (!current?.horizontal) return
    setOffset(0)
    if (event.type === 'pointerup' && current.offset <= -SWIPE_REPLY_PX) onReply?.(message)
  }

  return (
    <div
      data-message-id={message.id}
      className={cx(
        'scw:group/row scw:relative scw:flex scw:max-w-[88%] scw:touch-pan-y scw:items-end scw:gap-2 scw:rounded-2xl',
        own ? 'scw:justify-end scw:self-end' : 'scw:self-start',
        offset === 0 && 'scw:transition-transform scw:duration-200',
        flash && 'scw:animate-flash',
        className,
      )}
      style={offset ? { transform: `translateX(${offset}px)` } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      {own && onEdit && (
        <RowActionButton
          label={locale.edit}
          onClick={() => onEdit(message)}
        >
          <PencilIcon
            width={15}
            height={15}
          />
        </RowActionButton>
      )}
      {own && onReply && (
        <ReplyButton
          locale={locale}
          onClick={() => onReply(message)}
        />
      )}
      {children}
      {!own && onReply && (
        <ReplyButton
          locale={locale}
          onClick={() => onReply(message)}
        />
      )}
      {offset < 0 && (
        <span
          className='scw:absolute scw:top-1/2 scw:-right-9 scw:inline-flex scw:size-7 scw:-translate-y-1/2 scw:items-center scw:justify-center scw:rounded-full scw:bg-surface scw:text-muted'
          style={{ opacity: Math.min(1, -offset / SWIPE_REPLY_PX) }}
          aria-hidden
        >
          <ReplyIcon
            width={16}
            height={16}
          />
        </span>
      )}
    </div>
  )
}

// Только для мыши: на телефоне отвечают свайпом, а кнопка мешала бы тапу по пузырю
const RowActionButton = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) => (
  <button
    type='button'
    className='scw:hidden scw:size-7 scw:flex-none scw:cursor-pointer scw:items-center scw:justify-center scw:self-center scw:rounded-full scw:text-muted scw:opacity-0 scw:transition-opacity scw:hover:bg-surface scw:hover:text-text scw:focus-visible:opacity-100 scw:group-hover/row:opacity-100 scw:pointer-fine:inline-flex'
    aria-label={label}
    title={label}
    onClick={onClick}
  >
    {children}
  </button>
)

const ReplyButton = ({ locale, onClick }: { locale: SupportLocale; onClick: () => void }) => (
  <RowActionButton
    label={locale.reply}
    onClick={onClick}
  >
    <ReplyIcon
      width={16}
      height={16}
    />
  </RowActionButton>
)

interface MessageBubbleProps {
  message: SupportTimelineMessage
  own: boolean
  /** Колонка аватарки слева от пузыря — в одной строке с ним, чтобы стоять вровень с его низом. */
  avatar?: ReactNode
  ownAuthor: SupportTimelineMessage['author']
  /** «Хвостик» пузыря — только у последнего сообщения серии. */
  lastInGroup: boolean
  showAuthor: boolean
  read: boolean
  onRetry: (key: string) => void
  onDiscard: (key: string) => void
  onOpenImage: (key: string) => void
  onJumpTo: (reply: SupportMessageReply) => void
  assetBaseUrl?: string
  locale: SupportLocale
}

const MessageBubble = ({
  message,
  own,
  avatar,
  ownAuthor,
  lastInGroup,
  showAuthor,
  read,
  onRetry,
  onDiscard,
  onOpenImage,
  onJumpTo,
  assetBaseUrl,
  locale,
}: MessageBubbleProps) => {
  const reply = message.replyTo
  const deleted = message.deletedAt !== null
  const single = message.attachments.length === 1
  // Подпись, время и ошибка — от левого края пузыря, а не аватарки (w-10 + gap-2)
  const besideAvatar = avatar ? 'scw:ml-12' : undefined

  return (
    <div className={cx('scw:flex scw:min-w-0 scw:flex-col', own ? 'scw:items-end' : 'scw:items-start')}>
      {showAuthor && (
        <div className={cx('scw:mt-2 scw:mb-0.5 scw:text-xs scw:text-muted', besideAvatar)}>
          {authorLabel(message.author, message.authorName, locale)}
        </div>
      )}
      <div className='scw:flex scw:max-w-full scw:items-end scw:gap-2'>
        {avatar}
        <div
          className={cx(
            'scw:relative scw:min-w-0 scw:animate-bubble scw:rounded-message scw:px-3.5 scw:py-2 scw:wrap-anywhere',
            message.isInternalNote
              ? 'scw:bg-note-bubble scw:text-note-text'
              : own
                ? 'scw:bg-own-bubble scw:text-own-text'
                : 'scw:bg-other-bubble scw:text-other-text',
            lastInGroup && (own ? 'scw:rounded-br-sm' : 'scw:rounded-bl-sm'),
            message.localStatus === 'failed' && 'scw:opacity-70',
          )}
        >
          {message.isInternalNote && (
            <div className='scw:mb-0.5 scw:text-2xs scw:font-bold scw:tracking-[0.02em] scw:uppercase'>
              {locale.noteBadge}
            </div>
          )}
          {deleted ? (
            <div className='scw:italic scw:opacity-70'>{locale.deleted}</div>
          ) : (
            <>
              {reply && (
                <ReplyQuote
                  reply={reply}
                  ownAuthor={ownAuthor}
                  locale={locale}
                  className='scw:mt-0.5 scw:mb-1.5 scw:bg-current/8'
                  onClick={() => onJumpTo(reply)}
                />
              )}
              {message.attachments.length > 0 && (
                <div
                  className={cx(
                    'scw:-mx-1.5 scw:mt-0.5 scw:mb-1.5 scw:grid scw:gap-1',
                    single ? 'scw:grid-cols-[minmax(0,240px)]' : 'scw:grid-cols-[repeat(2,112px)]',
                  )}
                >
                  {message.attachments.map(file => (
                    <button
                      key={file.id}
                      type='button'
                      className={cx(
                        'scw:group scw:block scw:cursor-zoom-in scw:overflow-hidden scw:rounded-xl scw:bg-black/6 scw:focus-visible:outline-2 scw:focus-visible:outline-offset-2 scw:focus-visible:outline-accent',
                        single ? 'scw:max-h-70' : 'scw:aspect-square',
                      )}
                      aria-label={`${locale.galleryOpenImage}: ${file.name}`}
                      onClick={() => onOpenImage(fileKey(message, file.id))}
                    >
                      <img
                        className='scw:block scw:size-full scw:max-h-70 scw:object-cover scw:transition-transform scw:duration-200 scw:group-hover:scale-103'
                        src={resolveUrl(file.url, assetBaseUrl)}
                        alt={file.name}
                        loading='lazy'
                      />
                    </button>
                  ))}
                </div>
              )}
              {message.text && <div className='scw:whitespace-pre-wrap'>{message.text}</div>}
            </>
          )}
        </div>
      </div>
      {/* Время и галочки — под пузырём, а не внутри: текст не теснится и цвет не зависит от фона пузыря */}
      <div className={cx('scw:mt-0.5 scw:flex scw:items-center scw:gap-1 scw:text-2xs scw:text-muted', besideAvatar)}>
        {message.editedAt && !deleted && <span>{locale.edited}</span>}
        <span>{formatTime(message.createdAt)}</span>
        {own && (
          <MessageStatus
            message={message}
            read={read}
            locale={locale}
          />
        )}
      </div>
      {message.localStatus === 'failed' && (
        <div
          className={cx(
            'scw:mt-1 scw:flex scw:flex-wrap scw:items-center scw:gap-2 scw:text-xs scw:text-danger',
            besideAvatar,
          )}
        >
          <span>{message.error}</span>
          <button
            type='button'
            className={errorAction}
            onClick={() => onRetry(message.key)}
          >
            {locale.retry}
          </button>
          <button
            type='button'
            className={errorAction}
            onClick={() => onDiscard(message.key)}
          >
            {locale.discard}
          </button>
        </div>
      )}
    </div>
  )
}

const errorAction = 'scw:font-semibold scw:underline'

const statusIcon = 'scw:size-3.5'

const MessageStatus = ({
  message,
  read,
  locale,
}: {
  message: SupportTimelineMessage
  read: boolean
  locale: SupportLocale
}) => {
  if (message.localStatus === 'sending')
    return (
      <ClockIcon
        className={statusIcon}
        aria-label={locale.sending}
      />
    )
  if (message.localStatus === 'failed') return <AlertIcon className={cx(statusIcon, 'scw:text-danger')} />
  return read ? (
    <CheckCheckIcon
      className={cx(statusIcon, 'scw:text-accent')}
      aria-label={locale.read}
    />
  ) : (
    <CheckIcon
      className={statusIcon}
      aria-label={locale.sent}
    />
  )
}
