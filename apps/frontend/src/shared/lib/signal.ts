import { haptic } from '@/shared/miniapp'

// Звук конца таймера — короткий двойной сигнал без файлов: WebAudio есть во всех webview мессенджеров
const beep = () => {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return
    const ctx = new Context()
    for (const [offset, freq] of [
      [0, 880],
      [0.22, 1175],
    ] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.25, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.18)
      osc.connect(gain).connect(ctx.destination)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.2)
    }
    window.setTimeout(() => void ctx.close(), 800)
  } catch {
    // звук недоступен — сигнал остаётся только вибрацией, если она включена
  }
}

/** Конец таймера: звук и вибрация — каждое по своей настройке профиля (frontend-tz, 13.2) */
export const timerEndSignal = ({ timerSound, timerVibration }: { timerSound: boolean; timerVibration: boolean }) => {
  if (timerSound) beep()
  if (timerVibration) haptic.long()
}
