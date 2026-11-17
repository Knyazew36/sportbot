import type {
  SupportConversation,
  SupportConversationStatus,
  SupportInboxFilters,
  SupportOperatorClient,
  SupportOperatorConversation,
  SupportTimelineMessage,
} from '@app/support-chat-client'

import { useEffect, useMemo, useState } from 'react'

import { cx } from '../cx'
import { formatListTime } from '../format'
import { ArrowLeftIcon } from '../icons'
import { mergeLocale, type SupportLocale, type SupportLocaleOverride } from '../locale'
import {
  badge,
  button,
  buttonGhost,
  dot,
  iconButtonHiddenUntilMobile,
  input,
  state,
  statusTag,
  typing as typingLine,
} from '../ui'
import { useStoreState } from '../use-store'

import { Avatar } from './Avatar'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import type { SupportComposerAction, SupportComposerTemplate } from './TemplatePicker'
import { TypingDots } from './TypingDots'

export interface SupportInboxProps {
  client: SupportOperatorClient
  /** id текущего оператора — чтобы не показывать «Взять себе» на его же диалогах. */
  operatorId?: number
  /** Открытый диалог: управляемо снаружи (например, из адреса страницы). */
  selectedId: number | null
  onSelect: (id: number | null) => void
  /** Ошибка действия (взять, закрыть, …) — проект покажет своим тостом. */
  onError?: (error: unknown) => void
  assetBaseUrl?: string
  locale?: SupportLocaleOverride
  className?: string
  /** Шаблоны ответов и кнопки-действия в поле ввода (меню под молнией). */
  templates?: SupportComposerTemplate[]
  actions?: SupportComposerAction[]
}

const STATUS_TABS = (locale: SupportLocale): Array<{ label: string; status: SupportConversationStatus[] }> => [
  { label: locale.statusActive, status: ['OPEN', 'PENDING'] },
  { label: locale.statusOpen, status: ['OPEN'] },
  { label: locale.statusPending, status: ['PENDING'] },
  { label: locale.statusResolved, status: ['RESOLVED'] },
  { label: locale.statusClosed, status: ['CLOSED'] },
  { label: locale.statusAll, status: [] },
]

const SEARCH_DEBOUNCE_MS = 300

const pane = 'scw:flex scw:min-h-0 scw:min-w-0 scw:flex-col'
const listMessage = 'scw:px-4 scw:py-8 scw:text-center'

/** Инбокс оператора: список обращений с фильтрами и открытый диалог. */
export const SupportInbox = (props: SupportInboxProps) => {
  const { client, selectedId, onSelect } = props
  const locale = useMemo(() => mergeLocale(props.locale), [props.locale])

  useEffect(() => {
    client.connect()
    return () => client.disconnect()
  }, [client])

  return (
    <div
      className={cx(
        'scw-root scw:grid scw:h-full scw:min-h-120 scw:grid-cols-[minmax(280px,360px)_1fr] scw:overflow-hidden scw:rounded-3xl scw:border scw:border-border scw:bg-bg scw:max-[768px]:grid-cols-1',
        props.className,
      )}
    >
      <InboxList
        client={client}
        selectedId={selectedId}
        onSelect={onSelect}
        locale={locale}
      />
      {selectedId ? (
        <ConversationPane
          key={selectedId}
          client={client}
          id={selectedId}
          operatorId={props.operatorId}
          onBack={() => onSelect(null)}
          onError={props.onError}
          assetBaseUrl={props.assetBaseUrl}
          locale={locale}
          templates={props.templates}
          actions={props.actions}
        />
      ) : (
        <div
          className={cx(
            listMessage,
            'scw:flex scw:items-center scw:justify-center scw:text-muted scw:max-[768px]:hidden',
          )}
        >
          {locale.inboxPick}
        </div>
      )}
    </div>
  )
}

// ── Список ───────────────────────────────────────────────────────────────────

const InboxList = ({
  client,
  selectedId,
  onSelect,
  locale,
}: {
  client: SupportOperatorClient
  selectedId: number | null
  onSelect: (id: number) => void
  locale: SupportLocale
}) => {
  const { inbox, filters, typing, connected } = useStoreState(client.store)
  const [search, setSearch] = useState(filters.search)
  const tabs = STATUS_TABS(locale)

  useEffect(() => {
    if (search === filters.search) return
    const timer = setTimeout(() => client.setFilters({ search }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [client, search, filters.search])

  const activeTab = tabs.find(tab => tab.status.join() === filters.status.join())

  return (
    <aside
      className={cx(
        'scw:flex scw:min-h-0 scw:flex-col scw:border-r scw:border-border scw:max-[768px]:border-r-0',
        // На телефоне список и диалог — по очереди: открыт диалог — список прячем
        selectedId !== null && 'scw:max-[768px]:hidden',
      )}
    >
      <div className='scw:flex scw:flex-col scw:gap-2.5 scw:border-b scw:border-border scw:p-3.5'>
        <input
          className={input}
          type='search'
          value={search}
          placeholder={locale.inboxSearch}
          onChange={event => setSearch(event.target.value)}
        />
        <div
          className='scw:flex scw:flex-wrap scw:gap-1'
          role='tablist'
        >
          {tabs.map(tab => (
            <button
              key={tab.label}
              type='button'
              role='tab'
              aria-selected={tab === activeTab}
              className={cx(
                'scw:h-7 scw:rounded-full scw:px-2.5 scw:text-sm',
                tab === activeTab ? 'scw:bg-action scw:text-action-text' : 'scw:text-muted scw:hover:bg-surface',
              )}
              onClick={() => client.setFilters({ status: tab.status })}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className='scw:flex scw:items-center scw:gap-1'>
          {(
            [
              ['all', locale.assigneeAll],
              ['me', locale.assigneeMe],
              ['none', locale.assigneeNone],
            ] as Array<[SupportInboxFilters['assignee'], string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type='button'
              aria-pressed={filters.assignee === value}
              className={cx(
                'scw:h-7 scw:rounded-md scw:border scw:px-2.5 scw:text-sm',
                filters.assignee === value ? 'scw:border-text scw:text-text' : 'scw:border-border scw:text-muted',
              )}
              onClick={() => client.setFilters({ assignee: value })}
            >
              {label}
            </button>
          ))}
          <span
            className={cx(dot(connected), 'scw:ml-auto')}
            title={connected ? undefined : locale.connecting}
          />
        </div>
      </div>

      <div className='scw:min-h-0 scw:flex-1 scw:overflow-y-auto'>
        {inbox.error && <div className={cx(listMessage, 'scw:text-danger')}>{inbox.error}</div>}
        {!inbox.loading && !inbox.error && inbox.items.length === 0 && (
          <div className={cx(listMessage, 'scw:text-muted')}>{locale.inboxEmpty}</div>
        )}
        {inbox.items.map(conversation => (
          <InboxItem
            key={conversation.id}
            conversation={conversation}
            selected={conversation.id === selectedId}
            typing={conversation.id in typing}
            onSelect={onSelect}
            locale={locale}
          />
        ))}
      </div>

      {inbox.totalPages > 1 && (
        <div className='scw:flex scw:items-center scw:justify-between scw:gap-2 scw:border-t scw:border-border scw:px-3.5 scw:py-2.5 scw:text-sm scw:text-muted'>
          <button
            type='button'
            className={buttonGhost}
            disabled={filters.page <= 1}
            onClick={() => client.setPage(filters.page - 1)}
          >
            {locale.prevPage}
          </button>
          <span>
            {filters.page} / {inbox.totalPages}
          </span>
          <button
            type='button'
            className={buttonGhost}
            disabled={filters.page >= inbox.totalPages}
            onClick={() => client.setPage(filters.page + 1)}
          >
            {locale.nextPage}
          </button>
        </div>
      )}
    </aside>
  )
}

const contactName = (conversation: SupportConversation, locale: SupportLocale) =>
  conversation.contact?.name ||
  conversation.contact?.email ||
  conversation.contact?.phone ||
  `${locale.visitor} #${conversation.contactId}`

const InboxItem = ({
  conversation,
  selected,
  typing,
  onSelect,
  locale,
}: {
  conversation: SupportConversation
  selected: boolean
  typing: boolean
  onSelect: (id: number) => void
  locale: SupportLocale
}) => {
  const name = contactName(conversation, locale)
  const last = conversation.lastMessage
  const preview = typing
    ? locale.typing
    : last
      ? `${last.author === 'OPERATOR' ? `${locale.you}: ` : ''}${last.deletedAt ? locale.deleted : last.text || '📎'}`
      : ''

  return (
    <button
      type='button'
      className={cx(
        'scw:flex scw:w-full scw:gap-3 scw:border-b scw:border-border scw:px-3.5 scw:py-3 scw:text-left',
        selected ? 'scw:bg-other-bubble' : 'scw:hover:bg-surface',
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <Avatar name={name} />
      <span className='scw:flex scw:min-w-0 scw:flex-1 scw:flex-col scw:gap-0.5'>
        <span className='scw:flex scw:items-center scw:gap-2'>
          <span className='scw:flex-1 scw:truncate scw:font-semibold'>{name}</span>
          <span className='scw:flex-none scw:text-xs scw:text-muted'>{formatListTime(conversation.lastMessageAt)}</span>
        </span>
        <span className='scw:flex scw:items-center scw:gap-2'>
          <span
            className={cx(
              'scw:flex-1 scw:truncate',
              typing
                ? 'scw:text-accent scw:italic'
                : conversation.unreadForOperator > 0
                  ? 'scw:text-text'
                  : 'scw:text-muted',
            )}
          >
            {preview}
          </span>
          {conversation.unreadForOperator > 0 && <span className={badge}>{conversation.unreadForOperator}</span>}
        </span>
        <span className='scw:mt-0.5 scw:flex scw:flex-wrap scw:items-center scw:gap-x-2 scw:gap-y-1 scw:text-2xs scw:text-muted'>
          <span className={statusTag(conversation.status)}>{locale.status[conversation.status]}</span>
          <span>{locale.channel[conversation.sourceChannel]}</span>
          <span>
            {conversation.assigneeName ?? (conversation.assigneeId ? `#${conversation.assigneeId}` : locale.unassigned)}
          </span>
        </span>
      </span>
    </button>
  )
}

// ── Диалог ───────────────────────────────────────────────────────────────────

interface ConversationPaneProps {
  client: SupportOperatorClient
  id: number
  operatorId?: number
  onBack: () => void
  onError?: (error: unknown) => void
  assetBaseUrl?: string
  locale: SupportLocale
  templates?: SupportComposerTemplate[]
  actions?: SupportComposerAction[]
}

// Диалог открывается в эффекте, а не в useMemo: StrictMode вызывает эффекты дважды,
// и закрытая в первой очистке сессия иначе осталась бы в работе
const ConversationPane = (props: ConversationPaneProps) => {
  const { client, id } = props
  const [session, setSession] = useState<SupportOperatorConversation | null>(null)

  useEffect(() => {
    const opened = client.openConversation(id)
    setSession(opened)
    return () => opened.dispose()
  }, [client, id])

  return session ? (
    <ConversationView
      {...props}
      session={session}
    />
  ) : (
    <section className={pane} />
  )
}

const ConversationView = ({
  client,
  id,
  operatorId,
  onBack,
  onError,
  assetBaseUrl,
  locale,
  templates,
  actions,
  session,
}: ConversationPaneProps & { session: SupportOperatorConversation }) => {
  const { conversation, error, deleted } = useStoreState(session.store)
  const timeline = useStoreState(session.timeline.store)
  const { typing } = useStoreState(client.store)
  const [busy, setBusy] = useState(false)
  const [replyTo, setReplyTo] = useState<SupportTimelineMessage | null>(null)
  const [editing, setEditing] = useState<SupportTimelineMessage | null>(null)

  // Вид не пересоздаётся при смене диалога — цитата и правка из прошлого не должны уехать в новый
  useEffect(() => {
    setReplyTo(null)
    setEditing(null)
  }, [session])

  useEffect(() => {
    if (document.visibilityState !== 'hidden') void session.markRead()
  }, [session, timeline.messages])

  const run = (action: () => Promise<void>) => {
    setBusy(true)
    action()
      .catch((reason: unknown) => onError?.(reason))
      .finally(() => setBusy(false))
  }

  if (deleted || error) {
    return (
      <section className={pane}>
        <PaneBack
          onBack={onBack}
          locale={locale}
        />
        <div className={state.root}>
          <div className={state.title}>{deleted ? locale.conversationDeleted : error}</div>
        </div>
      </section>
    )
  }

  const contact = conversation?.contact
  const name = conversation ? contactName(conversation, locale) : ''
  const details = [contact?.email, contact?.phone, conversation && locale.channel[conversation.sourceChannel]].filter(
    Boolean,
  )
  const status = conversation?.status
  const contactTyping = id in typing

  return (
    <section className={pane}>
      <header className='scw:flex scw:flex-wrap scw:items-center scw:gap-3 scw:border-b scw:border-border scw:px-4 scw:py-3'>
        <PaneBack
          onBack={onBack}
          locale={locale}
        />
        <Avatar name={name} />
        <div className='scw:flex scw:min-w-40 scw:flex-1 scw:flex-col'>
          <span className='scw:text-md scw:font-bold'>{name}</span>
          <span className='scw:text-xs scw:text-muted'>{details.join(' · ')}</span>
        </div>
        {conversation && (
          <div className='scw:flex scw:flex-wrap scw:items-center scw:gap-2'>
            {status && <span className={statusTag(status)}>{locale.status[status]}</span>}
            {conversation.assigneeId !== operatorId && status !== 'CLOSED' && (
              <button
                type='button'
                className={buttonGhost}
                disabled={busy}
                onClick={() => run(() => session.assignToMe())}
              >
                {locale.assignToMe}
              </button>
            )}
            {(status === 'OPEN' || status === 'PENDING') && (
              <button
                type='button'
                className={buttonGhost}
                disabled={busy}
                onClick={() => run(() => session.update({ status: 'RESOLVED' }))}
              >
                {locale.resolve}
              </button>
            )}
            {status === 'CLOSED' || status === 'RESOLVED' ? (
              <button
                type='button'
                className={button}
                disabled={busy}
                onClick={() => run(() => session.reopen())}
              >
                {locale.reopen}
              </button>
            ) : (
              <button
                type='button'
                className={button}
                disabled={busy}
                onClick={() => run(() => session.close())}
              >
                {locale.close}
              </button>
            )}
          </div>
        )}
      </header>

      <MessageList
        messages={timeline.messages}
        ownAuthor='OPERATOR'
        otherReadSeq={conversation?.contactReadSeq ?? 0}
        loading={timeline.loading}
        hasMoreBefore={timeline.hasMoreBefore}
        loadingOlder={timeline.loadingOlder}
        onLoadOlder={() => void session.timeline.loadOlder()}
        onRetry={key => session.timeline.retry(key)}
        onDiscard={key => session.timeline.discard(key)}
        onReply={message => {
          setEditing(null)
          setReplyTo(message)
        }}
        onEdit={message => {
          setReplyTo(null)
          setEditing(message)
        }}
        // Сервер даёт править только свои сообщения, не коллег
        canEdit={message => operatorId !== undefined && message.authorId === operatorId}
        onRevealSeq={seq => session.timeline.loadUntil(seq)}
        assetBaseUrl={assetBaseUrl}
        locale={locale}
        showAuthorNames
        contactName={name}
        footer={
          contactTyping && (
            <div className={typingLine}>
              <TypingDots />
              {`${name} ${locale.typing}`}
            </div>
          )
        }
      />

      <Composer
        locale={locale}
        allowNote
        allowEmoji
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        ownAuthor='OPERATOR'
        templates={templates}
        actions={actions}
        contactName={contact?.name ?? null}
        editing={editing}
        onCancelEdit={() => setEditing(null)}
        onSaveEdit={text => {
          if (!editing?.id) return
          const id = editing.id
          // Правка не прошла — остаёмся в режиме, чтобы текст не пропал
          run(() => session.editMessage(id, text).then(() => setEditing(null)))
        }}
        onSend={(text, files, options) => {
          session.send(text, files, { ...options, replyTo })
          setReplyTo(null)
        }}
        onTyping={options => session.notifyTyping(options)}
      />
    </section>
  )
}

const PaneBack = ({ onBack, locale }: { onBack: () => void; locale: SupportLocale }) => (
  <button
    type='button'
    className={iconButtonHiddenUntilMobile}
    aria-label={locale.back}
    onClick={onBack}
  >
    <ArrowLeftIcon />
  </button>
)
