import { SUPPORT_LIMITS, type SupportTimelineMessage, toSupportReply } from '@app/support-chat-client'

import { type ClipboardEvent, type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'

import { cx } from '../cx'
import { CheckIcon, CloseIcon, PaperclipIcon, PencilIcon, SendIcon, SmileIcon, ZapIcon } from '../icons'
import type { SupportLocale } from '../locale'
import { iconButton } from '../ui'

import { EmojiPicker } from './EmojiPicker'
import { ReplyQuote } from './ReplyQuote'
import { type SupportComposerAction, type SupportComposerTemplate, TemplatePicker } from './TemplatePicker'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const MAX_HEIGHT_PX = 160
// Стабильные пустые значения по умолчанию: новый [] на каждый рендер ломал бы сравнения
const NO_TEMPLATES: SupportComposerTemplate[] = []
const NO_ACTIONS: SupportComposerAction[] = []

export interface ComposerProps {
  /** actions — выбранные кнопки-действия (пусто у заметки). */
  onSend: (text: string, files: File[], options: { internal: boolean; actions: string[] }) => void
  /** internal — сейчас пишется заметка (у оператора). */
  onTyping?: (options: { internal: boolean }) => void
  disabled?: boolean
  locale: SupportLocale
  /** Оператору: переключатель «заметка для коллег». */
  allowNote?: boolean
  /** Кнопка со смайлами рядом со скрепкой. */
  allowEmoji?: boolean
  autoFocus?: boolean
  /** На что отвечаем — плашка над полем; крестик или Escape отменяют. */
  replyTo?: SupportTimelineMessage | null
  onCancelReply?: () => void
  /** Чьи сообщения «свои» — для подписи «Вы» в цитате. */
  ownAuthor?: SupportTimelineMessage['author']
  /** Оператору: шаблоны ответов и кнопки-действия — меню под иконкой молнии. */
  templates?: SupportComposerTemplate[]
  actions?: SupportComposerAction[]
  /** Имя клиента для подстановки в шаблон. */
  contactName?: string | null
  /** Правка своего сообщения: поле берёт его текст, отправка сохраняет правку; черновик вернётся после. */
  editing?: SupportTimelineMessage | null
  onCancelEdit?: () => void
  onSaveEdit?: (text: string) => void
}

/**
 * Поле ввода: Enter — отправить, Shift+Enter — новая строка, картинки — скрепкой или вставкой из буфера.
 * Одно поле без валидации кроме длины — поэтому обычное состояние, а не библиотека форм.
 */
export const Composer = ({
  onSend,
  onTyping,
  disabled,
  locale,
  allowNote,
  allowEmoji,
  autoFocus,
  replyTo,
  onCancelReply,
  ownAuthor = 'CONTACT',
  templates = NO_TEMPLATES,
  actions = NO_ACTIONS,
  contactName = null,
  editing = null,
  onCancelEdit,
  onSaveEdit,
}: ComposerProps) => {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [note, setNote] = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const textRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const templatesButtonRef = useRef<HTMLButtonElement>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const closeEmoji = useCallback(() => setEmojiOpen(false), [])
  const closeTemplates = useCallback(() => setTemplatesOpen(false), [])
  // Картинки шаблона грузятся асинхронно: пока они в пути, оператор мог выбрать другой шаблон
  const templateRunRef = useRef(0)
  const hasTemplateMenu = templates.length > 0 || actions.length > 0

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])

  // Высота поля под текст, но не выше MAX_HEIGHT_PX — дальше прокрутка внутри
  useEffect(() => {
    const element = textRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [text])

  // Ответ на заметку — тоже заметка: иначе клиент увидел бы её текст в цитате
  const noteLocked = !!replyTo?.isInternalNote

  useEffect(() => {
    if (!replyTo) return
    if (replyTo.isInternalNote) setNote(true)
    textRef.current?.focus()
  }, [replyTo])

  // Начатый ответ не должен пропасть из-за правки старого сообщения: прячем его и возвращаем после
  const draftRef = useRef<{ text: string; files: File[]; actions: string[] } | null>(null)
  const editingId = editing?.id ?? null

  useEffect(() => {
    if (editingId === null) {
      const draft = draftRef.current
      draftRef.current = null
      if (draft) {
        setText(draft.text)
        setFiles(draft.files)
        setSelectedActions(draft.actions)
      }
      return
    }
    draftRef.current ??= { text, files, actions: selectedActions }
    templateRunRef.current += 1
    setText(editing?.text ?? '')
    setFiles([])
    setSelectedActions([])
    setNote(false)
    setTemplatesOpen(false)
    requestAnimationFrame(() => textRef.current?.focus())
    // Только по смене сообщения: черновик и текст правки берём в момент входа в режим, дальше их меняет ввод
  }, [editingId])

  const canSend = editing
    ? !disabled && text.trim().length > 0 && text.trim() !== editing.text
    : !disabled && (text.trim().length > 0 || files.length > 0)

  const submit = () => {
    if (!canSend) return
    if (editing) {
      onSaveEdit?.(text.trim())
      return
    }
    onSend(text.trim(), files, { internal: note, actions: note ? [] : selectedActions })
    templateRunRef.current += 1
    setText('')
    setFiles([])
    setSelectedActions([])
    // Заметка — исключение: после отправки снова обычный ответ, чтобы следующее не ушло не туда
    setNote(false)
    textRef.current?.focus()
  }

  const addFiles = (incoming: File[]) => {
    const images = incoming.filter(file => ACCEPT.split(',').includes(file.type))
    if (images.length) setFiles(current => [...current, ...images].slice(0, SUPPORT_LIMITS.attachmentsMax))
  }

  // Вставляем туда, где стоит курсор, а не в конец: смайл часто ставят посреди фразы
  const insertEmoji = (emoji: string) => {
    const element = textRef.current
    const start = element?.selectionStart ?? text.length
    const end = element?.selectionEnd ?? text.length
    const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, SUPPORT_LIMITS.textMaxLength)
    setText(next)
    onTyping?.({ internal: note })
    requestAnimationFrame(() => {
      if (!element) return
      element.focus()
      const caret = Math.min(start + emoji.length, next.length)
      element.setSelectionRange(caret, caret)
    })
  }

  // Шаблон заменяет черновик целиком: текст, картинки и кнопки — дальше их можно править как обычно
  const applyTemplate = (template: SupportComposerTemplate) => {
    const run = ++templateRunRef.current
    setTemplatesOpen(false)
    setText(template.text({ contactName }).slice(0, SUPPORT_LIMITS.textMaxLength))
    setFiles([])
    setSelectedActions((template.actions ?? []).filter(key => actions.some(action => action.key === key)))
    onTyping?.({ internal: note })
    requestAnimationFrame(() => textRef.current?.focus())

    template
      .files?.()
      .then(loaded => {
        if (templateRunRef.current !== run) return
        setFiles(current => [...loaded, ...current].slice(0, SUPPORT_LIMITS.attachmentsMax))
      })
      // Картинка шаблона не главное: без неё ответ всё равно можно отправить
      .catch(() => undefined)
  }

  const toggleAction = (key: string) =>
    setSelectedActions(current => (current.includes(key) ? current.filter(item => item !== key) : [...current, key]))

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape сначала отменяет правку или ответ, а не закрывает окно чата
    if (event.key === 'Escape' && editing && onCancelEdit) {
      event.stopPropagation()
      onCancelEdit()
      return
    }
    if (event.key === 'Escape' && replyTo && onCancelReply) {
      event.stopPropagation()
      onCancelReply()
      return
    }
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = [...event.clipboardData.files]
    if (pasted.length) {
      event.preventDefault()
      addFiles(pasted)
    }
  }

  return (
    <div
      className={cx(
        'scw:relative scw:flex-none scw:border-t scw:p-3 scw:transition-colors',
        note ? 'scw:border-note-text/15 scw:bg-note-bubble' : 'scw:border-border/70 scw:bg-bg',
      )}
    >
      {emojiOpen && (
        <EmojiPicker
          locale={locale}
          anchorRef={emojiButtonRef}
          onPick={insertEmoji}
          onClose={closeEmoji}
        />
      )}
      {templatesOpen && (
        <TemplatePicker
          locale={locale}
          templates={templates}
          actions={actions}
          selectedActions={selectedActions}
          actionsDisabled={note}
          onPickTemplate={applyTemplate}
          onToggleAction={toggleAction}
          onClose={closeTemplates}
          anchorRef={templatesButtonRef}
        />
      )}
      {editing && (
        <div className='scw:flex scw:items-center scw:gap-1 scw:px-1 scw:pb-2'>
          <div className='scw:flex scw:min-w-0 scw:flex-1 scw:items-center scw:gap-2 scw:rounded-lg scw:bg-surface scw:px-2.5 scw:py-1.5'>
            <PencilIcon
              width={14}
              height={14}
              className='scw:flex-none scw:text-accent'
            />
            <div className='scw:flex scw:min-w-0 scw:flex-col'>
              <span className='scw:text-xs scw:font-semibold scw:text-accent'>{locale.editing}</span>
              <span className='scw:truncate scw:text-xs scw:text-muted'>{editing.text}</span>
            </div>
          </div>
          <button
            type='button'
            className={iconButton}
            aria-label={locale.cancelEdit}
            title={locale.cancelEdit}
            onClick={onCancelEdit}
          >
            <CloseIcon
              width={16}
              height={16}
            />
          </button>
        </div>
      )}
      {replyTo && !editing && (
        <div className='scw:flex scw:items-center scw:gap-1 scw:px-1 scw:pb-2'>
          <ReplyQuote
            reply={toSupportReply(replyTo)}
            ownAuthor={ownAuthor}
            locale={locale}
            className='scw:flex-1 scw:bg-surface'
          />
          <button
            type='button'
            className={iconButton}
            aria-label={locale.cancelReply}
            title={locale.cancelReply}
            onClick={onCancelReply}
          >
            <CloseIcon
              width={16}
              height={16}
            />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className='scw:flex scw:flex-wrap scw:gap-1.5 scw:px-1 scw:pt-1 scw:pb-2'>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className='scw:relative scw:size-14 scw:overflow-hidden scw:rounded-lg scw:bg-surface'
            >
              {previews[index] && (
                <img
                  className='scw:size-full scw:object-cover'
                  src={previews[index]}
                  alt={file.name}
                />
              )}
              <button
                type='button'
                className='scw:absolute scw:top-0.5 scw:right-0.5 scw:inline-flex scw:rounded-full scw:bg-[rgba(22,25,28,0.7)] scw:p-[3px] scw:text-white'
                aria-label={locale.removeFile}
                onClick={() => setFiles(current => current.filter((_, i) => i !== index))}
              >
                <CloseIcon
                  width={12}
                  height={12}
                />
              </button>
            </div>
          ))}
        </div>
      )}
      {!note && selectedActions.length > 0 && (
        <div className='scw:flex scw:flex-wrap scw:gap-1.5 scw:px-1 scw:pb-2'>
          {actions
            .filter(action => selectedActions.includes(action.key))
            .map(action => (
              <span
                key={action.key}
                className='scw:inline-flex scw:items-center scw:gap-1 scw:rounded-full scw:border scw:border-accent/40 scw:bg-surface scw:py-0.5 scw:ps-2.5 scw:pe-1 scw:text-xs scw:font-semibold scw:text-text'
              >
                {action.label}
                <button
                  type='button'
                  className='scw:inline-flex scw:cursor-pointer scw:rounded-full scw:p-0.5 scw:text-muted scw:hover:text-text'
                  aria-label={locale.removeAction}
                  title={locale.removeAction}
                  onClick={() => toggleAction(action.key)}
                >
                  <CloseIcon
                    width={12}
                    height={12}
                  />
                </button>
              </span>
            ))}
        </div>
      )}
      <div
        className={cx(
          'scw:flex scw:items-end scw:gap-0.5 scw:rounded-[22px] scw:p-1 scw:transition-[background-color,box-shadow] scw:duration-150',
          // В фокусе поле «поднимается»: светлеет и получает тонкий контур
          note
            ? 'scw:bg-white/55'
            : 'scw:bg-surface scw:focus-within:bg-bg scw:focus-within:shadow-[0_0_0_1px_var(--scw-border),0_1px_3px_rgb(16_18_20/0.06)]',
        )}
      >
        <button
          type='button'
          className={iconButton}
          aria-label={locale.attach}
          title={locale.attach}
          disabled={disabled || !!editing || files.length >= SUPPORT_LIMITS.attachmentsMax}
          onClick={() => fileRef.current?.click()}
        >
          <PaperclipIcon />
        </button>
        {allowEmoji && (
          <button
            ref={emojiButtonRef}
            type='button'
            className={iconButton}
            aria-label={locale.emoji}
            aria-expanded={emojiOpen}
            title={locale.emoji}
            disabled={disabled}
            onClick={() => setEmojiOpen(open => !open)}
          >
            <SmileIcon />
          </button>
        )}
        {hasTemplateMenu && !editing && (
          <button
            ref={templatesButtonRef}
            type='button'
            className={iconButton}
            aria-label={locale.templates}
            aria-expanded={templatesOpen}
            title={locale.templates}
            disabled={disabled}
            onClick={() => setTemplatesOpen(open => !open)}
          >
            <ZapIcon />
          </button>
        )}
        <input
          ref={fileRef}
          type='file'
          accept={ACCEPT}
          multiple
          hidden
          onChange={event => {
            addFiles([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
        <textarea
          ref={textRef}
          className='scw:max-h-40 scw:min-h-9 scw:flex-1 scw:resize-none scw:border-0 scw:bg-transparent scw:px-1 scw:py-2 scw:leading-5 scw:text-text scw:outline-none scw:placeholder:text-muted'
          rows={1}
          value={text}
          maxLength={SUPPORT_LIMITS.textMaxLength}
          placeholder={note ? locale.notePlaceholder : locale.placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={event => {
            setText(event.target.value)
            onTyping?.({ internal: note })
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <button
          type='button'
          className={cx(
            'scw:inline-flex scw:size-9 scw:flex-none scw:items-center scw:justify-center scw:rounded-full scw:transition-[background-color,color,transform] scw:duration-150',
            // Заливка — только когда есть что отправить: пустое поле не зовёт нажать
            canSend ? 'scw:bg-accent scw:text-accent-text scw:active:scale-94' : 'scw:bg-transparent scw:text-muted',
          )}
          aria-label={editing ? locale.saveEdit : locale.send}
          title={editing ? locale.saveEdit : locale.send}
          disabled={!canSend}
          onClick={submit}
        >
          {editing ? (
            <CheckIcon
              width={18}
              height={18}
              strokeWidth={2.4}
            />
          ) : (
            <SendIcon
              width={18}
              height={18}
              strokeWidth={2.4}
            />
          )}
        </button>
      </div>
      {allowNote && !editing && (
        <label
          className='scw:mx-1 scw:mt-1 scw:inline-flex scw:cursor-pointer scw:select-none scw:items-center scw:gap-1.5 scw:text-xs scw:text-muted'
          title={noteLocked ? locale.replyNoteOnly : undefined}
        >
          <input
            type='checkbox'
            checked={note}
            disabled={noteLocked}
            onChange={event => setNote(event.target.checked)}
          />
          {locale.note}
        </label>
      )}
    </div>
  )
}
