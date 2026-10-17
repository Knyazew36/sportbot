/** Плашка отмены, которую сейчас видно */
export type UndoItem = {
  id: number
  title: string
  /** Сколько живёт плашка, мс */
  timeout: number
  startedAt: number
}

type ShowOptions = {
  title: string
  /** Нажали «Отменить» */
  onUndo: () => void
  /** Плашка ушла без отмены: время вышло, смахнули, её сменила следующая */
  onClose: () => void
  timeout?: number
}

type Entry = UndoItem & Pick<ShowOptions, 'onUndo' | 'onClose'> & { timer: number }

let current: Entry | null = null
let seq = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach(listener => listener())

// Таймер живёт здесь, а не в компоненте: срок выходит, даже если плашку некуда нарисовать
const take = (id: number) => {
  if (current?.id !== id) return null
  const entry = current
  current = null
  clearTimeout(entry.timer)
  emit()
  return entry
}

/** Одна плашка на всё приложение: новая закрывает прежнюю, и та считается непринятой к отмене */
export const undoBar = {
  show: ({ title, onUndo, onClose, timeout = 3000 }: ShowOptions): number => {
    if (current) undoBar.close(current.id)
    const id = ++seq
    current = {
      id,
      title,
      timeout,
      startedAt: Date.now(),
      onUndo,
      onClose,
      timer: window.setTimeout(() => undoBar.close(id), timeout),
    }
    emit()
    return id
  },
  close: (id: number) => take(id)?.onClose(),
  undo: (id: number) => take(id)?.onUndo(),
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
  get: (): UndoItem | null => current,
}
