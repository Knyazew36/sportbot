import type { SupportTimelineMessage, SupportVisitorClient } from '@app/support-chat-client'

import { useEffect, useMemo, useState } from 'react'

import { cx } from '../cx'
import { ChatIcon, CloseIcon, HeadsetIcon } from '../icons'
import { mergeLocale, type SupportLocaleOverride } from '../locale'
import { button, iconButton, state as stateUi, typing } from '../ui'
import { useStoreState } from '../use-store'

import { Composer } from './Composer'
import { MessageList } from './MessageList'
import { TypingDots } from './TypingDots'

export interface SupportWidgetProps {
  client: SupportVisitorClient
  /** База для путей файлов от сервера (адрес API). */
  assetBaseUrl?: string
  locale?: SupportLocaleOverride
  /** Подключиться сразу (для счётчика непрочитанного), а не при первом открытии. По умолчанию true. */
  startOnMount?: boolean
  /** Отступ кнопки от края, если внизу страницы своя панель (мобильное меню). */
  offsetBottom?: number
  /** Открыть окно сразу, без нажатия на кнопку. */
  defaultOpen?: boolean
  className?: string
}

/** Плавающая кнопка и окно чата посетителя. */
export const SupportWidget = ({
  client,
  assetBaseUrl,
  locale: localeOverride,
  startOnMount = true,
  offsetBottom,
  defaultOpen = false,
  className,
}: SupportWidgetProps) => {
  const locale = useMemo(() => mergeLocale(localeOverride), [localeOverride])
  const state = useStoreState(client.store)
  const timeline = useStoreState(client.timeline.store)
  const [open, setOpen] = useState(defaultOpen)
  const [replyTo, setReplyTo] = useState<SupportTimelineMessage | null>(null)

  // Новый диалог (прошлый закрыли) — цитата из старого уже ни к чему
  useEffect(() => setReplyTo(null), [timeline.conversationId])

  useEffect(() => {
    if (startOnMount) void client.start()
  }, [client, startOnMount])

  useEffect(() => {
    if (open) void client.start()
  }, [client, open])

  // Окно открыто и вкладка видна — всё в ленте прочитано
  useEffect(() => {
    if (!open || state.unread === 0 || document.visibilityState === 'hidden') return
    void client.markRead()
  }, [client, open, state.unread, timeline.messages])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const conversation = state.conversation
  // Клиенту не важно, кто именно из операторов ответил: везде просто «Оператор»
  const messages = useMemo(() => timeline.messages.map(withoutOperatorName), [timeline.messages])

  // «Подключение…» клиенту не показываем: сообщения и так ждут в очереди и уйдут, когда связь вернётся
  const subtitle = state.operatorsOnline > 0 ? locale.operatorsOnline : locale.operatorsOffline
  const online = state.operatorsOnline > 0 && state.connected
  const unread = open ? 0 : state.unread

  return (
    <div
      className={cx(
        'scw-root scw-widget scw:fixed scw:right-(--scw-offset-side) scw:bottom-(--scw-offset-bottom) scw:z-60 scw:flex scw:flex-col scw:items-end scw:gap-3 scw:max-[480px]:right-4',
        className,
      )}
      style={offsetBottom ? { ['--scw-offset-bottom' as string]: `${offsetBottom}px` } : undefined}
    >
      {open && (
        <section
          className={cx(
            'scw:relative scw:flex scw:h-[min(620px,calc(100dvh_-_120px))] scw:w-95 scw:animate-pop scw:flex-col scw:overflow-hidden scw:rounded-[20px] scw:bg-bg scw:shadow-panel',
            // На телефоне окно на весь экран
            'scw:max-[480px]:fixed scw:max-[480px]:inset-0 scw:max-[480px]:h-dvh scw:max-[480px]:w-auto scw:max-[480px]:rounded-none scw:max-[480px]:border-0',
          )}
          role='dialog'
          aria-label={locale.title}
        >
          {/* Шапка поверх ленты, полупрозрачная: сообщения уходят под неё при прокрутке — объём без декора */}
          <header className='scw:absolute scw:inset-x-0 scw:top-0 scw:z-10 scw:flex scw:h-16 scw:items-center scw:gap-3 scw:border-b scw:border-border/60 scw:bg-bg/80 scw:pr-2.5 scw:pl-4 scw:backdrop-blur-xl scw:backdrop-saturate-150'>
            <span className='scw:relative scw:inline-flex scw:size-10 scw:flex-none scw:items-center scw:justify-center scw:rounded-full scw:bg-accent scw:text-accent-text'>
              <HeadsetIcon
                width={20}
                height={20}
              />
              <span
                className={cx(
                  'scw:absolute scw:right-0 scw:bottom-0 scw:size-2.5 scw:rounded-full scw:ring-2 scw:ring-bg',
                  online ? 'scw:bg-success' : 'scw:bg-muted',
                )}
              />
            </span>
            <div className='scw:flex scw:min-w-0 scw:flex-1 scw:flex-col scw:gap-1'>
              <span className='scw:text-md scw:leading-none scw:font-semibold scw:tracking-[-0.01em]'>
                {locale.title}
              </span>
              <span className='scw:truncate scw:text-xs scw:leading-none scw:text-muted'>{subtitle}</span>
            </div>
            <button
              type='button'
              className={iconButton}
              aria-label={locale.closeLabel}
              onClick={() => setOpen(false)}
            >
              <CloseIcon
                width={18}
                height={18}
              />
            </button>
          </header>

          {state.status === 'error' ? (
            <div className={cx(stateUi.root, 'scw:pt-16')}>
              <div className={stateUi.title}>{locale.errorTitle}</div>
              <div className={stateUi.text}>{state.error}</div>
              <button
                type='button'
                className={cx(button, 'scw:mt-2')}
                onClick={() => void client.restart()}
              >
                {locale.errorRetry}
              </button>
            </div>
          ) : (
            <MessageList
              // Отступ под шапку: она лежит поверх ленты
              className='scw:pt-20'
              messages={messages}
              ownAuthor='CONTACT'
              otherReadSeq={conversation?.operatorReadSeq ?? 0}
              loading={timeline.loading}
              hasMoreBefore={timeline.hasMoreBefore}
              loadingOlder={timeline.loadingOlder}
              onLoadOlder={() => void client.loadOlder()}
              onRetry={key => client.retry(key)}
              onDiscard={key => client.discard(key)}
              onReply={setReplyTo}
              onRevealSeq={seq => client.timeline.loadUntil(seq)}
              assetBaseUrl={assetBaseUrl}
              locale={locale}
              showAuthorNames
              empty={
                !timeline.loading && (
                  <div className={stateUi.root}>
                    <span className='scw:mb-2 scw:inline-flex scw:size-12 scw:items-center scw:justify-center scw:rounded-full scw:bg-surface scw:text-text'>
                      <ChatIcon
                        width={22}
                        height={22}
                      />
                    </span>
                    <div className={stateUi.title}>{locale.emptyTitle}</div>
                    <div className={stateUi.text}>{locale.emptyText}</div>
                  </div>
                )
              }
              footer={
                state.operatorTyping !== null && (
                  <div className={typing}>
                    <TypingDots />
                    {locale.operatorTyping}
                  </div>
                )
              }
            />
          )}

          <Composer
            locale={locale}
            disabled={state.status === 'error'}
            autoFocus
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            ownAuthor='CONTACT'
            onSend={(text, files) => {
              client.send(text, files, { replyTo })
              setReplyTo(null)
            }}
            onTyping={() => client.notifyTyping()}
          />
        </section>
      )}

      <button
        type='button'
        className={cx(
          'scw:relative scw:inline-flex scw:size-14 scw:items-center scw:justify-center scw:rounded-full scw:bg-accent scw:text-accent-text scw:shadow-launcher scw:transition-transform scw:duration-200 scw:hover:-translate-y-0.5 scw:active:translate-y-0',
          // Окно на телефоне во весь экран, у него свой крестик
          open && 'scw:max-[480px]:hidden',
        )}
        aria-label={open ? locale.closeLabel : unread ? `${locale.launcherLabel}: ${unread}` : locale.launcherLabel}
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
      >
        {/* Окно закрыто, а оператор ответил — волны от кнопки, пока не откроют */}
        {!open && state.unread > 0 && (
          <>
            <span className={ring} />
            <span className={cx(ring, 'scw:[animation-delay:0.9s]')} />
          </>
        )}
        {/* key — чтобы при смене (и при каждом новом непрочитанном) содержимое заново проигрывало появление */}
        <span
          key={open ? 'close' : unread ? `unread-${unread}` : 'chat'}
          className='scw:inline-flex scw:animate-swap'
        >
          {open ? (
            <CloseIcon
              width={26}
              height={26}
            />
          ) : unread ? (
            // Число вместо значка: заметнее отдельного бейджа в углу
            <span className='scw:text-lg scw:font-semibold scw:tabular-nums'>{unread > 99 ? '99+' : unread}</span>
          ) : (
            <ChatIcon
              width={26}
              height={26}
            />
          )}
        </span>
      </button>
    </div>
  )
}

const withoutOperatorName = (message: SupportTimelineMessage): SupportTimelineMessage => ({
  ...message,
  authorName: message.author === 'OPERATOR' ? null : message.authorName,
  replyTo: message.replyTo?.author === 'OPERATOR' ? { ...message.replyTo, authorName: null } : message.replyTo,
})

// -z-10 — под кнопкой: волна выходит из-за её края и не перекрывает иконку
const ring =
  'scw:pointer-events-none scw:absolute scw:inset-0 scw:-z-10 scw:animate-ring scw:rounded-full scw:bg-accent scw:motion-reduce:hidden'
