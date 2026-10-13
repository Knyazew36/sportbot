import { profile } from './mock'
import { createPreviewStore } from './preview-store'

// Настройки тренировки: профиль их меняет, экран тренировки сразу слушается
export type TrainingSettings = {
  /** Показывать таймер отдыха на экране тренировки */
  showRestTimer: boolean
  autoStartRest: boolean
  sound: boolean
  restSeconds: string
}

const settings = createPreviewStore<TrainingSettings>({
  showRestTimer: true,
  autoStartRest: profile.autoStartRest,
  sound: profile.sound,
  restSeconds: String(profile.restSeconds),
})

export const useTrainingSettings = settings.useStore

export const setTrainingSettings = (patch: Partial<TrainingSettings>) => settings.set(prev => ({ ...prev, ...patch }))

// Шаблоны, взятые в свои программы: отметка видна и в списке, и на странице шаблона
const taken = createPreviewStore<number[]>([])

export const useTakenTemplates = taken.useStore

export const takeTemplate = (id: number) => taken.set(ids => (ids.includes(id) ? ids : [...ids, id]))
