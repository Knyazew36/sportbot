import { type RefObject, useEffect, useRef } from 'react'

import { cx } from '../cx'
import { CheckIcon } from '../icons'
import type { SupportLocale } from '../locale'

/** Заготовка ответа оператора. Текст правится в поле как обычно — шаблон только подставляет его. */
export interface SupportComposerTemplate {
  key: string
  label: string
  /** contactName — имя клиента из карточки, если известно. */
  text: (context: { contactName: string | null }) => string
  /** Картинки к шаблону; грузятся после подстановки текста, сбой не мешает отправить текст. */
  files?: () => Promise<File[]>
  /** Ключи кнопок из actions, которые шаблон включает. */
  actions?: string[]
}

/** Кнопка-действие под сообщением. Что она делает у клиента, решает проект по key. */
export interface SupportComposerAction {
  key: string
  label: string
}

interface TemplatePickerProps {
  locale: SupportLocale
  templates: SupportComposerTemplate[]
  actions: SupportComposerAction[]
  selectedActions: string[]
  /** Заметка: клиент её не увидит, кнопки к ней не прикладываются. */
  actionsDisabled: boolean
  onPickTemplate: (template: SupportComposerTemplate) => void
  onToggleAction: (key: string) => void
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
}

const sectionTitle = 'scw:px-2 scw:pt-1.5 scw:pb-1 scw:text-xs scw:font-semibold scw:text-muted'
const row =
  'scw:flex scw:w-full scw:cursor-pointer scw:items-center scw:gap-2 scw:rounded-lg scw:px-2 scw:py-1.5 scw:text-left scw:transition-colors scw:enabled:hover:bg-surface scw:disabled:cursor-default scw:disabled:opacity-50'

/** Всплывающее меню над полем ввода: шаблоны и переключатели кнопок; закрывается кликом мимо или Escape. */
export const TemplatePicker = ({
  locale,
  templates,
  actions,
  selectedActions,
  actionsDisabled,
  onPickTemplate,
  onToggleAction,
  onClose,
  anchorRef,
}: TemplatePickerProps) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    // capture — чтобы Escape не долетел до окна чата и не закрыл его
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [onClose, anchorRef])

  return (
    <div
      ref={rootRef}
      role='dialog'
      aria-label={locale.templates}
      className='scw:absolute scw:bottom-full scw:left-3 scw:z-10 scw:mb-1 scw:flex scw:max-h-80 scw:w-72 scw:max-w-[calc(100%-1.5rem)] scw:flex-col scw:overflow-y-auto scw:rounded-ui scw:border scw:border-border scw:bg-bg scw:p-1.5 scw:shadow-panel'
    >
      {templates.length > 0 && (
        <>
          <div className={sectionTitle}>{locale.templatesTitle}</div>
          {templates.map(template => (
            <button
              key={template.key}
              type='button'
              className={cx(row, 'scw:text-text')}
              onClick={() => onPickTemplate(template)}
            >
              {template.label}
            </button>
          ))}
        </>
      )}
      {actions.length > 0 && (
        <>
          <div className={cx(sectionTitle, templates.length > 0 && 'scw:mt-1 scw:border-t scw:border-border/70')}>
            {locale.actionsTitle}
          </div>
          {actions.map(action => {
            const selected = selectedActions.includes(action.key)
            return (
              <button
                key={action.key}
                type='button'
                role='checkbox'
                aria-checked={selected}
                disabled={actionsDisabled}
                className={cx(row, 'scw:text-text')}
                onClick={() => onToggleAction(action.key)}
              >
                <span
                  className={cx(
                    'scw:inline-flex scw:size-4 scw:flex-none scw:items-center scw:justify-center scw:rounded scw:border',
                    selected ? 'scw:border-accent scw:bg-accent scw:text-accent-text' : 'scw:border-border',
                  )}
                >
                  {selected && (
                    <CheckIcon
                      width={12}
                      height={12}
                      strokeWidth={3}
                    />
                  )}
                </span>
                {action.label}
              </button>
            )
          })}
          <div className='scw:px-2 scw:pt-1 scw:pb-0.5 scw:text-xs scw:text-muted'>
            {actionsDisabled ? locale.actionsNote : locale.actionsHint}
          </div>
        </>
      )}
    </div>
  )
}
