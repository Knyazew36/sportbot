import type { ComponentProps } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow } from './Typography'

type BoxInputProps = ComponentProps<'input'> & { label: string }

// Числовое поле с подписью внутри рамки: вес, повторы, вес тела. Крупная цифра читается на вытянутой руке
export const BoxInput = ({ label, className, ...props }: BoxInputProps) => (
  <label
    className={cn(
      'bg-background border-input focus-within:border-primary flex flex-col justify-center border-[1.5px] px-2.5 pt-1 pb-0.5',
      className,
    )}
  >
    <Eyebrow
      size='sm'
      className='tracking-[0.06em] whitespace-nowrap'
    >
      {label}
    </Eyebrow>
    {/* Браузер и менеджеры паролей подставляли бы прошлые значения — а число всегда вводится заново */}
    <input
      inputMode='decimal'
      autoComplete='off'
      autoCorrect='off'
      spellCheck={false}
      data-1p-ignore
      data-lpignore='true'
      data-form-type='other'
      className='sb-poster placeholder:text-foreground/20 h-8 w-full bg-transparent text-[28px] leading-none outline-none'
      {...props}
    />
  </label>
)
