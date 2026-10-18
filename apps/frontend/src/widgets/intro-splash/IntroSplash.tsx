import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const WORD = 'СПОРТБОТ'
const BLUE = '#006eff'
const INK = '#0a0a0a'
const PAPER = '#fff8f1'

// Таймлайн в секундах: canvas и DOM-слой читают одни и те же отметки, чтобы не разъехаться
const T = {
  swarm: 0.2,
  word: 2.2,
  exit: 3.7,
  done: 4.5,
}

type Particle = {
  sx: number
  sy: number
  tx: number
  ty: number
  delay: number
  dur: number
  bend: number
  size: number
}

const easeOutQuart = (k: number) => 1 - (1 - k) ** 4
const clamp01 = (k: number) => Math.min(1, Math.max(0, k))

// Точки, из которых состоит слово: рисуем текст во внеэкранный canvas и берём закрашенные пиксели
const sampleWord = (w: number, h: number, fontSize: number) => {
  const off = document.createElement('canvas')
  off.width = w
  off.height = h
  const ctx = off.getContext('2d')
  if (!ctx) return []
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${fontSize}px 'Oswald Variable', 'Arial Narrow', sans-serif`
  ctx.fillText(WORD, w / 2, h / 2)
  const data = ctx.getImageData(0, 0, w, h).data
  const gap = Math.max(3, Math.round(fontSize / 26))
  const points: { x: number; y: number }[] = []
  for (let y = 0; y < h; y += gap) {
    for (let x = 0; x < w; x += gap) {
      if ((data[(y * w + x) * 4 + 3] ?? 0) > 128) points.push({ x, y })
    }
  }
  return points
}

const buildParticles = (w: number, h: number): Particle[] => {
  const fontSize = Math.min(w / 4.6, 170)
  const points = sampleWord(w, h, fontSize)
  // Не больше ~1200 частиц: на слабых телефонах дальше начинает проседать кадр
  const step = Math.max(1, Math.ceil(points.length / 1200))
  const result: Particle[] = []
  for (let i = 0; i < points.length; i += step) {
    const p = points[i]
    if (!p) continue
    result.push({
      // Пыль рассыпана по всему экрану и стягивается к буквам
      sx: Math.random() * w,
      sy: Math.random() * h,
      tx: p.x,
      ty: p.y,
      delay: T.swarm + Math.random() * 0.6,
      dur: 1.2 + Math.random() * 0.4,
      bend: (Math.random() - 0.5) * 120,
      size: Math.random() < 0.8 ? 1.5 : 2.2,
    })
  }
  return result
}

const DustCanvas = ({ reduced }: { reduced: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let raf = 0
    let cancelled = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)

    const run = (particles: Particle[]) => {
      const start = performance.now()

      const frame = (now: number) => {
        const t = (now - start) / 1000
        ctx.clearRect(0, 0, w, h)

        // Когда проявилась настоящая надпись, пыль растворяется в ней
        const fade = 1 - clamp01((t - T.word - 0.2) / 0.6)
        for (const p of particles) {
          const k = easeOutQuart(clamp01((t - p.delay) / p.dur))
          // Лёгкий изгиб траектории, чтобы частицы не летели строем по прямой
          const arc = Math.sin(k * Math.PI) * p.bend
          const x = p.sx + (p.tx - p.sx) * k + arc
          const y = p.sy + (p.ty - p.sy) * k
          const appear = clamp01((t - p.delay + 0.3) / 0.5)
          const alpha = appear * fade * (0.35 + 0.65 * k)
          ctx.fillStyle = `rgba(255,248,241,${alpha})`
          ctx.fillRect(x, y, p.size, p.size)
        }

        if (t < T.word + 1) raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }

    // Без загруженного Oswald слово сэмплится системным шрифтом и не совпадает с DOM-надписью
    document.fonts
      .load(`700 100px 'Oswald Variable'`)
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return
        const particles = buildParticles(w, h)
        if (reduced) for (const p of particles) p.delay = 0
        run(particles)
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <canvas
      ref={ref}
      className='absolute inset-0'
    />
  )
}

type Props = {
  onDone: () => void
}

// Заставка старта приложения: пыль собирается в слово, по нему проходит блик, бумага раскрывается кругом
export const IntroSplash = ({ onDone }: Props) => {
  const reduced = useReducedMotion() ?? false

  useEffect(() => {
    const id = window.setTimeout(onDone, T.done * 1000)
    return () => window.clearTimeout(id)
  }, [onDone])

  return createPortal(
    <div
      className='fixed inset-0 z-[1000] cursor-pointer overflow-hidden select-none'
      style={{ background: INK }}
      onClick={onDone}
    >
      {/* Мягкое синее свечение за словом, разгорается вместе со сборкой */}
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{ background: `radial-gradient(ellipse 60% 40% at center, ${BLUE}55, transparent 70%)` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: T.swarm, duration: T.word - T.swarm, ease: 'easeOut' }}
      />

      <DustCanvas reduced={reduced} />

      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <div className='flex flex-col items-center'>
          <div
            className='relative overflow-hidden font-display leading-none font-bold'
            style={{ fontSize: 'min(calc(100vw / 4.6), 170px)', color: PAPER }}
          >
            <motion.span
              className='block'
              initial={{ opacity: 0, filter: 'blur(8px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ delay: T.word - 0.2, duration: 0.6, ease: 'easeOut' }}
            >
              {WORD}
            </motion.span>

            {/* Блик, пробегающий по слову */}
            <motion.span
              className='absolute inset-y-0 w-1/4 -skew-x-12'
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
              initial={{ left: '-40%' }}
              animate={{ left: '130%' }}
              transition={{ delay: T.word + 0.35, duration: 0.8, ease: 'easeInOut' }}
            />
          </div>

          <motion.div
            className='mt-5 h-px'
            style={{ background: BLUE }}
            initial={{ width: 0 }}
            animate={{ width: 64 }}
            transition={{ delay: T.word + 0.3, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          />

          <motion.div
            className='mt-4 text-sm tracking-[0.3em] uppercase'
            style={{ color: `${PAPER}99` }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.word + 0.5, duration: 0.6, ease: 'easeOut' }}
          >
            тренировки
          </motion.div>
        </div>
      </div>

      {/* Выход: синий и следом бумага раскрываются кругом из центра — под ними уже приложение */}
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{ background: BLUE }}
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
        transition={{ delay: T.exit, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
      />
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{ background: PAPER }}
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
        transition={{ delay: T.exit + 0.12, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
      />
    </div>,
    document.body,
  )
}
