import { z } from 'zod'

import type { RenderFormat } from './formats'

// Схемы props — единственная правда о том, что принимает композиция: по ним Studio строит панель
// props, сервер валидирует запрос, фронт — форму. React и Remotion сюда не тянем: пакет читает сервер

/**
 * Длительность плашки на выбор, с. Плашку кладут на короткий кусок видео: дольше 7 с она мешает
 * смотреть само упражнение
 */
export const LOWER_THIRD_SECONDS = [3, 5, 7] as const

export const lowerThirdProps = z.object({
  title: z.string().trim().min(1, 'Название — обязательно').max(60, 'Название — до 60 символов'),
  subtitle: z.string().trim().max(60, 'Подпись — до 60 символов'),
  fill: z.enum(['mint', 'rest', 'blue', 'rose']),
  seconds: z.literal(LOWER_THIRD_SECONDS),
  /** chroma — ключевой цвет под заливку, для формата mp4-chroma */
  background: z.enum(['paper', 'transparent', 'chroma']),
})
export type LowerThirdProps = z.infer<typeof lowerThirdProps>

type CompositionMeta = {
  /** Как ролик называется у пользователя: в сообщении бота, на экране */
  title: string
  schema: z.ZodType<Record<string, unknown>>
  /** Формат кадра — ключ tokens.video из @sportbot/brand */
  size: 'reels' | 'post' | 'square'
  /** Длительность по умолчанию; если в props есть seconds — ролик длится столько */
  durationInFrames: number
  /** Форматы, в которых композицию можно заказать: по кнопке на каждый; первый — по умолчанию */
  formats: readonly [RenderFormat, ...RenderFormat[]]
  /** Пример props: defaultProps в Studio и пример в Swagger */
  example: Record<string, unknown>
}

/** Композиции, которые пользователь может отрендерить сам. id — он же id <Composition> в бандле */
export const COMPOSITIONS = {
  'lower-third': {
    title: 'Плашка упражнения',
    schema: lowerThirdProps,
    size: 'reels',
    durationInFrames: 90,
    formats: ['mp4-chroma', 'webm-alpha', 'mov-alpha'],
    example: {
      title: 'Жим гантелей лежа',
      subtitle: '4 подхода × 10 повторов',
      fill: 'mint',
      seconds: 3,
      background: 'transparent',
    } satisfies LowerThirdProps,
  },
} as const satisfies Record<string, CompositionMeta>

export type CompositionId = keyof typeof COMPOSITIONS
export type CompositionProps<Id extends CompositionId> = z.infer<(typeof COMPOSITIONS)[Id]['schema']>

export const COMPOSITION_IDS = Object.keys(COMPOSITIONS) as CompositionId[]

export const isCompositionId = (id: string): id is CompositionId => id in COMPOSITIONS
