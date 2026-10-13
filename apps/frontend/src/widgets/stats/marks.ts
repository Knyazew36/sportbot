// Отметки дней календаря тренировок и их подписи
export type DayMark = 'done' | 'skip' | 'pause' | 'moved' | 'pending' | 'rest' | 'future'

export const MARK_LABEL: Record<DayMark, string> = {
  done: 'Тренировка',
  skip: 'Пропуск',
  pause: 'Пауза',
  moved: 'Перенос',
  pending: 'Ждёт ответа',
  rest: 'Отдых',
  future: 'По плану',
}
