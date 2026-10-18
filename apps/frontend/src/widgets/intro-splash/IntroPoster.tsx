import { motion } from 'motion/react'
import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const WORD = 'СПОРТБОТ'
const BEATS = ['СИЛА', 'ТЕМП', 'ПРОГРЕСС']
const TAPE = 'СИЛА · ТЕМП · ПРОГРЕСС · '
const STRIPES = 6

// Таймлайн в секундах. Ритм как у монтажа спортивного ролика: шторка → три склейки → логотип
const T = {
  shutterIn: 0,
  beats: 0.55,
  beat: 0.36,
  shutterOut: 1.7,
  logo: 1.85,
  out: 3.25,
  done: 3.85,
}

const EASE = [0.76, 0, 0.24, 1] as const
const total = T.done

// Доли таймлайна для keyframes: motion принимает times в диапазоне 0..1
const at = (s: number) => Math.min(1, Math.max(0, s / total))

type Roles = {
  bg: string
  shutter: string
  beat: string
  logo: string
  shadow: string
  tape: string
  tapeText: string
}

// Цвета берём из токенов темы и палитры на <html> (их ставит inline-скрипт до первого кадра),
// поэтому синяя/розовая и светлая/тёмная собираются сами. Готовые значения, а не var(): motion не интерполирует var() в textShadow
const readRoles = (): Roles => {
  const root = document.documentElement
  const css = getComputedStyle(root)
  const token = (name: string) => css.getPropertyValue(name).trim()
  const paper = token('--sb-paper')
  const ink = token('--sb-ink')
  const accent = token('--sb-blue')

  // Тёмная: ночной фон темы, акцентная шторка, светлые буквы с акцентной тенью
  if (root.classList.contains('dark')) {
    return { bg: paper, shutter: accent, beat: paper, logo: ink, shadow: accent, tape: accent, tapeText: paper }
  }
  // Светлая: без белого фона — плакат на акцентном цвете, чернильная шторка и тень
  return { bg: accent, shutter: ink, beat: paper, logo: paper, shadow: ink, tape: ink, tapeText: paper }
}

const RolesContext = createContext<Roles | null>(null)

const useRoles = () => {
  const roles = useContext(RolesContext)
  if (!roles) throw new Error('useRoles вне IntroPoster')
  return roles
}

// Шторка из вертикальных полос: падают сверху лесенкой и уходят вниз так же лесенкой
const Shutter = () => {
  const { shutter } = useRoles()
  return (
    <div className='absolute inset-0 flex'>
      {Array.from({ length: STRIPES }, (_, i) => {
        const lag = i * 0.05
        return (
          <motion.div
            key={i}
            className='h-full flex-1'
            style={{ background: shutter, marginLeft: -1 }}
            initial={{ y: '-101%' }}
            animate={{ y: ['-101%', '0%', '0%', '101%'] }}
            transition={{
              duration: total,
              ease: [EASE, 'linear', EASE],
              times: [
                at(T.shutterIn + lag),
                at(T.shutterIn + lag + 0.45),
                at(T.shutterOut + lag),
                at(T.shutterOut + lag + 0.45),
              ],
            }}
          />
        )
      })}
    </div>
  )
}

// Слово-склейка: выезжает снизу из-под маски, держится долю секунды и уходит вверх
const Beat = ({ word, index }: { word: string; index: number }) => {
  const { beat } = useRoles()
  const start = T.beats + index * T.beat
  return (
    <div className='absolute inset-0 flex items-center justify-center'>
      {/* Маска ровно по слову: иначе сдвинутое вниз слово остаётся видно на экране */}
      <span className='inline-block overflow-hidden pb-[0.06em]'>
        <motion.span
          className='block font-display leading-none font-bold'
          style={{ color: beat, fontSize: 'min(calc(100vw / 4.4), 220px)' }}
          initial={{ y: '110%' }}
          animate={{ y: ['110%', '0%', '0%', '-110%'] }}
          transition={{
            duration: total,
            ease: [EASE, 'linear', EASE],
            times: [at(start), at(start + 0.14), at(start + T.beat - 0.08), at(start + T.beat + 0.06)],
          }}
        >
          {word}
        </motion.span>
      </span>
    </div>
  )
}

// Наклонная лента с бегущим текстом под логотипом — плакатный акцент
const Tape = () => {
  const { tape, tapeText } = useRoles()
  return (
    <motion.div
      className='absolute top-[68%] left-1/2 w-[160vw] overflow-hidden py-2'
      style={{ background: tape, rotate: -7, x: '-50%' }}
      initial={{ y: '-50%', clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 0)', 'inset(0 0% 0 100%)'] }}
      transition={{
        duration: total,
        ease: [EASE, 'linear', EASE],
        times: [at(T.logo - 0.05), at(T.logo + 0.45), at(T.out - 0.05), at(T.out + 0.35)],
      }}
    >
      <motion.div
        className='flex w-max font-display text-xl font-bold whitespace-nowrap'
        style={{ color: tapeText }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
      >
        <span>{TAPE.repeat(8)}</span>
        <span>{TAPE.repeat(8)}</span>
      </motion.div>
    </motion.div>
  )
}

// Логотип: буквы поднимаются из-под маски по одной, затем отбрасывают жёсткую тень, как кнопки приложения
const Logo = () => {
  const { logo, shadow } = useRoles()
  const flat = `0px 0px 0 ${shadow}`
  const pressed = `6px 6px 0 ${shadow}`
  return (
    <div className='relative flex flex-col items-center'>
      <div
        className='flex font-display leading-[0.95] font-bold'
        style={{ fontSize: 'min(calc(100vw / 4.8), 170px)', color: logo }}
      >
        {WORD.split('').map((letter, i) => (
          <span
            key={i}
            className='overflow-hidden px-[0.02em] pb-[0.08em]'
          >
            <motion.span
              className='block'
              initial={{ y: '110%', textShadow: flat }}
              animate={{ y: ['110%', '0%', '0%', '-110%'], textShadow: [flat, flat, pressed, pressed] }}
              transition={{
                duration: total,
                ease: [EASE, [0.2, 0.8, 0.2, 1], EASE],
                times: [
                  at(T.logo + i * 0.045),
                  at(T.logo + i * 0.045 + 0.5),
                  at(T.logo + 0.95),
                  at(T.out + i * 0.03 + 0.3),
                ],
              }}
            >
              {letter}
            </motion.span>
          </span>
        ))}
      </div>

      <div className='mt-3 flex items-center gap-3 overflow-hidden'>
        <motion.span
          className='h-[2px]'
          style={{ background: logo }}
          initial={{ width: 0 }}
          animate={{ width: [0, 0, 40, 40, 0] }}
          transition={{
            duration: total,
            ease: EASE,
            times: [0, at(T.logo + 0.5), at(T.logo + 0.9), at(T.out), at(T.out + 0.3)],
          }}
        />
        <motion.span
          className='text-sm font-medium tracking-[0.3em] uppercase'
          style={{ color: logo }}
          initial={{ y: '120%' }}
          animate={{ y: ['120%', '120%', '0%', '0%', '-120%'] }}
          transition={{
            duration: total,
            ease: EASE,
            times: [0, at(T.logo + 0.55), at(T.logo + 0.95), at(T.out), at(T.out + 0.3)],
          }}
        >
          тренировки
        </motion.span>
      </div>
    </div>
  )
}

type Props = {
  onDone: () => void
}

// Заставка «кинетический плакат»: шторка, три быстрых слова-склейки, логотип с жёсткой тенью. Тап пропускает
export const IntroPoster = ({ onDone }: Props) => {
  const [roles] = useState(readRoles)

  useEffect(() => {
    const id = window.setTimeout(onDone, T.done * 1000)
    return () => window.clearTimeout(id)
  }, [onDone])

  return createPortal(
    <RolesContext.Provider value={roles}>
      <motion.div
        className='fixed inset-0 z-[1000] cursor-pointer overflow-hidden select-none'
        style={{ background: roles.bg }}
        onClick={onDone}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: total, times: [0, at(T.out + 0.3), 1], ease: 'easeOut' }}
      >
        <Tape />

        <div className='absolute inset-0 flex items-center justify-center'>
          <Logo />
        </div>

        <Shutter />

        {BEATS.map((word, i) => (
          <Beat
            key={word}
            word={word}
            index={i}
          />
        ))}
      </motion.div>
    </RolesContext.Provider>,
    document.body,
  )
}
