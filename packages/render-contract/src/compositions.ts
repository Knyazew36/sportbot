import { z } from 'zod'

import type { RenderFormat } from './formats'

// Схемы props — единственная правда о том, что принимает композиция: по ним Studio строит панель
// props, сервер валидирует запрос, фронт — форму. React и Remotion сюда не тянем: пакет читает сервер

/**
 * Длительность плашки на выбор, с. Плашку кладут на короткий кусок видео: дольше 7 с она мешает
 * смотреть само упражнение
 */
export const LOWER_THIRD_SECONDS = [3, 5, 7] as const

/** Заливки роликов — акценты приложения; у плашки и заставки один набор */
export const fillSchema = z.enum(['mint', 'rest', 'blue', 'rose'])

/**
 * Фон под роликом. paper — свой кремовый; transparent и chroma — ролик накладывают поверх видео:
 * chroma — ключевой цвет под заливку, для формата mp4-chroma
 */
export const backgroundSchema = z.enum(['paper', 'transparent', 'chroma'])

export const lowerThirdProps = z.object({
  title: z.string().trim().min(1, 'Название — обязательно').max(60, 'Название — до 60 символов'),
  subtitle: z.string().trim().max(60, 'Подпись — до 60 символов'),
  fill: fillSchema,
  seconds: z.literal(LOWER_THIRD_SECONDS),
  background: backgroundSchema,
})
export type LowerThirdProps = z.infer<typeof lowerThirdProps>

/** Длительность заставки на выбор, с. Анимация идёт ~1,7 с — дальше пауза, чтобы успели прочитать */
export const END_CARD_SECONDS = [2, 3, 4] as const

export const endCardProps = z.object({
  fill: fillSchema,
  seconds: z.literal(END_CARD_SECONDS),
  background: backgroundSchema,
})
export type EndCardProps = z.infer<typeof endCardProps>

type CompositionMeta = {
  /** Как ролик называется у пользователя: в сообщении бота, на экране */
  title: string
  schema: z.ZodType<Record<string, unknown>>
  /** Формат кадра — ключ tokens.video из @sportbot/brand */
  size: 'reels' | 'post' | 'square'
  /** Длительность по умолчанию; если в props есть seconds — ролик длится столько */
  durationInFrames: number
  /** Форматы, в которых композицию можно заказать: по кнопке на каждый; первый — по умолчанию и с пометкой «Подходит чаще всего» */
  formats: readonly [RenderFormat, ...RenderFormat[]]
  /** Своя подсказка к формату, если общая из RENDER_FORMATS для этого ролика не подходит */
  hints?: Partial<Record<RenderFormat, string>>
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
    // MOV первым: прозрачный без потерь подходит чаще всего, остальные — если редактор его не открыл
    formats: ['mov-alpha', 'webm-alpha', 'mp4-chroma', 'mov-prores', 'mov-prores-apple', 'mov-prores-light'],
    example: {
      title: 'Жим гантелей лежа',
      subtitle: '4 подхода × 10 повторов',
      fill: 'mint',
      seconds: 3,
      background: 'transparent',
    } satisfies LowerThirdProps,
  },
  'end-card': {
    title: 'Заставка',
    schema: endCardProps,
    size: 'reels',
    durationInFrames: 90,
    // Обычный MP4 ставят встык в конец ролика; с прозрачностью и хромакеем — внахлёст на последние кадры
    formats: ['mp4', 'mov-alpha', 'webm-alpha', 'mp4-chroma', 'mov-prores', 'mov-prores-apple', 'mov-prores-light'],
    hints: {
      mp4: 'MP4 с фоном: поставь в самый конец своего ролика',
      'mov-alpha':
        'Без фона: положи поверх последних секунд видео — лист въедет и закроет его. CapCut, Premiere, Final Cut, DaVinci',
    },
    example: {
      fill: 'mint',
      seconds: 3,
      background: 'paper',
    } satisfies EndCardProps,
  },
} as const satisfies Record<string, CompositionMeta>

export type CompositionId = keyof typeof COMPOSITIONS
export type CompositionProps<Id extends CompositionId> = z.infer<(typeof COMPOSITIONS)[Id]['schema']>

export const COMPOSITION_IDS = Object.keys(COMPOSITIONS) as CompositionId[]

export const isCompositionId = (id: string): id is CompositionId => id in COMPOSITIONS
