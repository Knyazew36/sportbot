import Model, { type IExerciseData, type IMuscleStats, type Muscle } from 'react-body-highlighter'

import { type MouseEvent, useRef } from 'react'

import { cn } from '@/shared/lib/utils'

export type BodySide = 'front' | 'back'

// Анатомическая основа — react-body-highlighter (MIT). Наши коды мышц → её зоны.
// Средних дельт у неё нет: они подсвечивают передние и задние сразу
const ZONES: Record<string, Muscle[]> = {
  traps: ['trapezius'],
  'front-delts': ['front-deltoids'],
  'mid-delts': ['front-deltoids', 'back-deltoids'],
  'rear-delts': ['back-deltoids'],
  chest: ['chest'],
  lats: ['upper-back'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],
  abs: ['abs', 'obliques'],
  'lower-back': ['lower-back'],
  glutes: ['gluteal', 'abductors'],
  quads: ['quadriceps'],
  hamstrings: ['hamstring'],
  adductors: ['adductor'],
  calves: ['calves', 'left-soleus', 'right-soleus'],
}

// Тап по зоне → наш код. Дельты спереди — передние, сзади — задние; голова, шея и колени не выбираются
const PICK: Partial<Record<Muscle, string>> = {
  trapezius: 'traps',
  chest: 'chest',
  'upper-back': 'lats',
  biceps: 'biceps',
  triceps: 'triceps',
  forearm: 'forearms',
  abs: 'abs',
  obliques: 'abs',
  'lower-back': 'lower-back',
  gluteal: 'glutes',
  abductors: 'glutes',
  quadriceps: 'quads',
  hamstring: 'hamstrings',
  adductor: 'adductors',
  calves: 'calves',
  'left-soleus': 'calves',
  'right-soleus': 'calves',
}

const zonesOf = (codes: readonly string[]) => codes.flatMap(c => ZONES[c] ?? [])

// Частота 1 — «помогают», 2 — выбранные: библиотека красит по индексу цвета
const COLORS = ['color-mix(in oklab, var(--sb-blue) 45%, var(--background))', 'var(--sb-blue)']
const BODY = 'color-mix(in oklab, var(--sb-blue) 14%, var(--background))'

type BodyMapProps = {
  side: BodySide
  /** Залиты сплошным: выбранные или основные */
  selected?: readonly string[]
  /** Залиты наполовину: помогающие мышцы в карточке упражнения */
  secondary?: readonly string[]
  /** Тап по зоне — код мышцы. Без него карта — просто картинка */
  onToggle?: (code: string) => void
  className?: string
}

// Тап мимо мышцы (в просвет, по колену) ищет ближайшую в этом радиусе — единицы viewBox, ширина фигуры 100
const REACH = 10

const segmentDistance = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

const polygonDistance = (polygon: SVGPolygonElement, x: number, y: number) => {
  const points = Array.from(polygon.points)
  let min = Infinity
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length]!
    min = Math.min(min, segmentDistance(x, y, a.x, a.y, b.x, b.y))
  })
  return min
}

// Карта тела в цветах плаката: тело — светлый синий, выбранные мышцы — сплошной синий
export const BodyMap = ({ side, selected = [], secondary = [], onToggle, className }: BodyMapProps) => {
  const data: IExerciseData[] = [
    { name: 'secondary', muscles: zonesOf(secondary.filter(c => !selected.includes(c))), frequency: 1 },
    { name: 'selected', muscles: zonesOf(selected), frequency: 2 },
  ]

  // Попал ли тап в выбираемую мышцу; идёт ли поиск ближайшей — чтобы повторные клики не запускали его снова
  const handled = useRef(false)
  const searching = useRef(false)

  const click = ({ muscle }: IMuscleStats) => {
    const code = muscle === 'front-deltoids' ? 'front-delts' : muscle === 'back-deltoids' ? 'rear-delts' : PICK[muscle]
    if (!code) return
    handled.current = true
    onToggle?.(code)
  }

  // Мимо мышцы — кликаем по ближайшим полигонам по очереди, пока один не окажется выбираемой мышцей
  const nearest = (e: MouseEvent<HTMLDivElement>) => {
    if (handled.current || searching.current) return
    const svg = e.currentTarget.querySelector('svg')
    const matrix = svg?.getScreenCTM()?.inverse()
    if (!svg || !matrix) return
    const { x, y } = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix)
    const candidates = Array.from(svg.querySelectorAll('polygon'))
      .filter(p => p !== e.target)
      .map(p => ({ p, d: polygonDistance(p, x, y) }))
      .filter(c => c.d <= REACH)
      .sort((a, b) => a.d - b.d)
    searching.current = true
    for (const { p } of candidates) {
      p.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }))
      if (handled.current) break
    }
    searching.current = false
  }

  return (
    <div
      role='img'
      aria-label={side === 'front' ? 'Тело спереди' : 'Тело сзади'}
      onClickCapture={onToggle ? () => (handled.current = false) : undefined}
      onClick={onToggle ? nearest : undefined}
      className={cn(
        'touch-manipulation select-none [&_polygon]:transition-[fill] [&_polygon]:duration-200',
        onToggle ? 'cursor-pointer' : '[&_polygon]:cursor-default!',
        className,
      )}
    >
      <Model
        type={side === 'front' ? 'anterior' : 'posterior'}
        data={data}
        bodyColor={BODY}
        highlightedColors={COLORS}
        onClick={onToggle ? click : undefined}
        style={{ width: '100%' }}
        svgStyle={{ display: 'block', width: '100%', height: 'auto' }}
      />
    </div>
  )
}
