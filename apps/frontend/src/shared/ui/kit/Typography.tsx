import { type ElementType, type HTMLAttributes, useLayoutEffect, useRef } from 'react'

import { cn } from '@/shared/lib/utils'

// Типографика Спортбота. Четыре голоса:
//   Poster  — плакатный кондензированный: заголовки и цифры
//   Lead    — волосяная антиква-курсив: вводная строка перед плакатом
//   Eyebrow — метка капсом с разрядкой: заголовок секции, подпись над значением
//   Text    — основной гротеск: абзацы, строки списков, пояснения
// Размер, межстрочный и цвет настроены здесь: на страницах выбирают size и tone, а не подбирают классы.
// className остаётся для раскладки (отступы, выравнивание, ширина).
// Кегль стоит в cn() до межстрочного: tailwind-merge считает text-[…] конфликтом с leading-* и выкидывает
// межстрочный, если он идёт раньше

type BaseProps = HTMLAttributes<HTMLElement> & {
  /** Тег: h1/h2 для заголовков, span внутри строки, dt/dd в списках определений */
  as?: ElementType
}

const TONE = {
  default: 'text-foreground',
  primary: 'text-primary',
  /** Вторичный текст: подписи, пояснения, мета */
  muted: 'text-muted-foreground',
  /** Слегка приглушённый текст абзацев */
  soft: 'text-foreground/80',
  /** Фоновая цифра или буква: номер комплекса, неактивный билет, «первый раз» */
  faint: 'text-foreground/35',
  danger: 'text-destructive',
  /** На чёрной плашке InkPanel */
  inverse: 'text-background',
  inverseMuted: 'text-background/60',
  /** Цвет берётся у родителя: на чёрной плашке, внутри кнопок и бейджей. По умолчанию у Poster, Lead и Text */
  inherit: '',
} as const

export type Tone = keyof typeof TONE

// ── Poster ──────────────────────────────────────────────────────────────────

// Шкала с шагом ~1.25. От 2xl кегль тянется по ширине экрана (потолок — макет на 440px), чтобы не вылезать на 320px.
// Межстрочный привязан к кеглю: плакатные 0.86 хороши для крупных слов, а мелкие строки при таком
// интервале слипаются с подписью под ними
const POSTER_SIZE = {
  xs: 'text-[16px] leading-[1.1]',
  sm: 'text-[20px] leading-[1.1]',
  md: 'text-[24px] leading-[1.05]',
  lg: 'text-[28px] leading-[1]',
  xl: 'text-[34px] leading-[0.95]',
  '2xl': 'text-[min(44px,11vw)] leading-[0.9]',
  '3xl': 'text-[min(56px,13vw)] leading-[0.88]',
  '4xl': 'text-[min(72px,16vw)] leading-[0.86]',
  '5xl': 'text-[min(88px,20vw)] leading-[0.86]',
  display: 'text-[min(104px,24vw)] leading-[0.86]',
  hero: 'text-[min(132px,29.5vw)] leading-[0.86]',
} as const

export type PosterSize = keyof typeof POSTER_SIZE

// Ужимает кегль, пока строка не поместится в свою ширину. Потолок — кегль из шкалы
const useFitText = (enabled: boolean, content: unknown) => {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!enabled || !el) return

    const fit = () => {
      el.style.fontSize = ''
      const available = el.clientWidth
      const needed = el.scrollWidth
      if (available > 0 && needed > available) {
        const base = parseFloat(getComputedStyle(el).fontSize)
        el.style.fontSize = `${Math.floor(((base * available) / needed) * 10) / 10}px`
      }
    }

    fit()
    const observer = new ResizeObserver(fit)
    if (el.parentElement) observer.observe(el.parentElement)
    // Ширина слова меняется, когда догружается плакатный шрифт
    void document.fonts?.ready.then(fit)
    return () => observer.disconnect()
  }, [enabled, content])

  return ref
}

type PosterProps = BaseProps & {
  size?: PosterSize
  tone?: Tone
  /** Цифры: плотный интервал и равная ширина знаков — таймеры, серия, проценты, веса */
  numeric?: boolean
  /** Одна строка с многоточием. Высота строки увеличена: обрезка иначе срезает Ё, Й и низ букв Щ, Ц */
  truncate?: boolean
  /** Одна строка, которая сама ужимается под ширину. Для слов из данных: название комплекса, имя */
  fit?: boolean
}

export const Poster = ({
  as: Tag = 'p',
  size = 'md',
  tone = 'inherit',
  numeric,
  truncate,
  fit,
  className,
  children,
  ...props
}: PosterProps) => {
  const ref = useFitText(Boolean(fit), children)
  return (
    <Tag
      ref={ref}
      className={cn(
        'font-display font-bold tracking-[-0.02em] uppercase',
        POSTER_SIZE[size],
        TONE[tone],
        numeric && 'leading-[0.82] tabular-nums',
        truncate && 'truncate leading-[1.3]',
        // Строка одна: плакатный интервал 0.86 тут только мешает — диакритика Й и Ё упирается в соседний блок
        fit && 'block leading-none whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

// Единица измерения рядом с плакатной цифрой: «кг», «раз», «с». Гротеском, строчными — чтобы не спорила с числом
export const Unit = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'font-grotesk ml-1 text-[0.4em] leading-none font-normal tracking-normal normal-case opacity-50',
      className,
    )}
    {...props}
  />
)

// Знак при плакатной цифре тем же шрифтом, но мельче: «%» у посещаемости
export const Suffix = ({ className, ...props }: HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('text-[0.42em]', className)}
    {...props}
  />
)

// ── Lead ────────────────────────────────────────────────────────────────────

const LEAD_SIZE = {
  sm: 'text-[22px]',
  md: 'text-[26px]',
  lg: 'text-[min(34px,8.5vw)]',
  xl: 'text-[min(40px,10vw)]',
} as const

type LeadProps = BaseProps & { size?: keyof typeof LEAD_SIZE; tone?: Tone }

// Вводная строка перед плакатным заголовком: «сегодня на очереди —»
export const Lead = ({ as: Tag = 'p', size = 'lg', tone = 'inherit', className, ...props }: LeadProps) => (
  <Tag
    className={cn(
      LEAD_SIZE[size],
      'font-serif leading-[1.05] font-light tracking-[-0.02em] italic',
      TONE[tone],
      className,
    )}
    {...props}
  />
)

// ── Eyebrow ─────────────────────────────────────────────────────────────────

const EYEBROW_SIZE = {
  /** В тесных рамках: подпись поля ввода, дни недели календаря */
  sm: 'text-[10.5px]',
  md: 'text-[11px]',
} as const

type EyebrowProps = BaseProps & { size?: keyof typeof EYEBROW_SIZE; tone?: Tone }

// Метка над значением или заголовок секции: капс с разрядкой вместо жирности
export const Eyebrow = ({ as: Tag = 'span', size = 'md', tone = 'muted', className, ...props }: EyebrowProps) => (
  <Tag
    className={cn(
      EYEBROW_SIZE[size],
      'font-grotesk leading-[1.25] font-normal tracking-[0.14em] uppercase',
      TONE[tone],
      className,
    )}
    {...props}
  />
)

// ── Text ────────────────────────────────────────────────────────────────────

const TEXT_SIZE = {
  /** Легенды, единицы, служебные подписи */
  '2xs': 'text-[12px]',
  /** Мета строки списка, подсказки под полем */
  xs: 'text-[13px]',
  sm: 'text-[14px]',
  /** Абзацы и пояснения */
  md: 'text-[15px]',
  /** Название строки списка, текст «как делать» */
  lg: 'text-[16px]',
} as const

type TextProps = BaseProps & { size?: keyof typeof TEXT_SIZE; tone?: Tone }

// Основной текст: абзацы, названия строк, пояснения
export const Text = ({ as: Tag = 'p', size = 'md', tone = 'inherit', className, ...props }: TextProps) => (
  <Tag
    // Сброс капса и плакатного шрифта: подпись внутри кнопки наследовала бы их от родителя
    className={cn(
      TEXT_SIZE[size],
      'font-grotesk leading-snug font-[350] tracking-[-0.02em] normal-case',
      TONE[tone],
      className,
    )}
    {...props}
  />
)
