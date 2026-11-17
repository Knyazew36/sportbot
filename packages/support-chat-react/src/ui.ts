import type { SupportConversationStatus } from '@app/support-chat-client'

import { cx } from './cx'

/*
 * Общие наборы классов. В одном элементе не смешиваем две утилиты одного свойства без варианта
 * (`scw:bg-action` + `scw:bg-transparent`): какая победит, решает порядок в CSS, а не в className.
 * Поэтому у кнопок варианты целиком, а не «база + переопределение».
 */

/** Круглая кнопка-иконка без display — его ставит вызывающий (бывает скрыта до брейкпоинта). */
const iconButtonBase =
  'scw:size-9 scw:flex-none scw:items-center scw:justify-center scw:rounded-full scw:transition-colors'

export const iconButton = cx(
  'scw:inline-flex',
  iconButtonBase,
  'scw:text-muted scw:enabled:hover:bg-surface scw:enabled:hover:text-text',
)

export const iconButtonHiddenUntilMobile = cx(
  'scw:hidden scw:max-[768px]:inline-flex',
  iconButtonBase,
  'scw:text-muted scw:enabled:hover:bg-surface scw:enabled:hover:text-text',
)

const buttonBase =
  'scw:inline-flex scw:h-8.5 scw:items-center scw:justify-center scw:whitespace-nowrap scw:rounded-ui scw:border scw:px-3.5 scw:font-semibold'

export const button = cx(buttonBase, 'scw:border-transparent scw:bg-action scw:text-action-text')

export const buttonGhost = cx(buttonBase, 'scw:border-border scw:text-text scw:enabled:hover:bg-surface')

export const input =
  'scw:h-9 scw:w-full scw:rounded-ui scw:border scw:border-border scw:bg-bg scw:px-3 scw:text-text scw:outline-none scw:focus:border-accent'

export const dot = (online: boolean) =>
  cx(
    'scw:inline-block scw:size-2 scw:flex-none scw:rounded-full',
    online ? 'scw:bg-success' : 'scw:bg-muted scw:opacity-60',
  )

export const badge =
  'scw:inline-flex scw:h-5 scw:min-w-5 scw:items-center scw:justify-center scw:rounded-full scw:bg-danger scw:px-1.5 scw:text-2xs scw:font-bold scw:leading-none scw:text-white'

const STATUS_TAG: Record<SupportConversationStatus, string> = {
  OPEN: 'scw:bg-danger/12 scw:text-danger',
  PENDING: 'scw:bg-teal/14 scw:text-teal-deep',
  RESOLVED: 'scw:bg-success/14 scw:text-success',
  CLOSED: 'scw:bg-surface scw:text-muted',
}

export const statusTag = (status: SupportConversationStatus) =>
  cx(
    'scw:inline-flex scw:h-5 scw:items-center scw:whitespace-nowrap scw:rounded-full scw:px-2 scw:text-2xs scw:font-semibold',
    STATUS_TAG[status],
  )

/** Пустое состояние и ошибка по центру области. */
export const state = {
  root: 'scw:flex scw:flex-1 scw:flex-col scw:items-center scw:justify-center scw:gap-1.5 scw:px-6 scw:py-8 scw:text-center',
  icon: 'scw:mb-1 scw:text-accent',
  title: 'scw:text-lg scw:font-semibold',
  text: 'scw:max-w-65 scw:text-muted',
}

/** Крутилка загрузки; размер задаёт вызывающий. */
export const spinner =
  'scw:inline-block scw:flex-none scw:animate-spin scw:rounded-full scw:border-2 scw:border-border scw:border-t-accent scw:motion-reduce:animate-none'

/** «печатает…» под лентой. */
export const typing =
  'scw:mt-1 scw:inline-flex scw:animate-bubble scw:items-center scw:gap-2 scw:self-start scw:rounded-full scw:bg-other-bubble scw:px-3 scw:py-2 scw:text-xs scw:text-muted'
