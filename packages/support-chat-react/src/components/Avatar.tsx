import { type ReactNode, useState } from 'react'

import { cx } from '../cx'
import { initials } from '../format'

/**
 * Пары фон/текст для аватарок по умолчанию: читаются и в светлой, и в тёмной теме.
 * Цвет зависит от имени — один человек всегда одного цвета.
 */
const PALETTE = [
  ['#e8f7f8', '#0f7f7f'],
  ['#fde8ec', '#c0223f'],
  ['#fff4cc', '#8a6500'],
  ['#e8eefc', '#2f55c4'],
  ['#efe8fc', '#6b3fc4'],
  ['#e6f6ec', '#1f7a45'],
  ['#fdeee3', '#b4561b'],
  ['#eceef0', '#4b5258'],
] as const

const colorFor = (seed: string) => {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]!
}

export interface AvatarProps {
  /** По имени — инициалы и цвет. */
  name: string
  /** Фото; не загрузилось — инициалы. */
  src?: string | null
  /** Вместо инициалов (оператор без имени, бот). */
  icon?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export const Avatar = ({ name, src, icon, size = 'md', className }: AvatarProps) => {
  const [broken, setBroken] = useState(false)
  const [background, color] = colorFor(name)

  return (
    <span
      className={cx(
        'scw:inline-flex scw:flex-none scw:select-none scw:items-center scw:justify-center scw:overflow-hidden scw:rounded-full scw:font-bold scw:tracking-[0.02em]',
        size === 'sm' ? 'scw:size-7 scw:text-2xs' : 'scw:size-10 scw:text-base',
        className,
      )}
      style={{ background, color }}
      title={name}
      aria-hidden
    >
      {src && !broken ? (
        <img
          className='scw:size-full scw:object-cover'
          src={src}
          alt=''
          onError={() => setBroken(true)}
        />
      ) : (
        (icon ?? initials(name))
      )}
    </span>
  )
}
