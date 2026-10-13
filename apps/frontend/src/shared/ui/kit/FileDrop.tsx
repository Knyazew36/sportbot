import { UploadIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

import { Text } from './Typography'

type FileDropProps = {
  /** MIME-маска: 'image/*', '.json' */
  accept: string
  title: string
  hint?: ReactNode
  onFile: (file: File) => void
  className?: string
}

// Выбор одного файла: картинка записи справочника, файл импорта. Вся плашка — цель нажатия
export const FileDrop = ({ accept, title, hint, onFile, className }: FileDropProps) => (
  <label
    className={cn(
      'border-foreground/60 hover:border-primary hover:bg-accent focus-within:border-primary flex cursor-pointer items-center gap-3 border-[1.5px] border-dashed p-4 transition-colors',
      className,
    )}
  >
    <input
      type='file'
      accept={accept}
      className='sr-only'
      onChange={e => {
        const file = e.target.files?.[0]
        if (file) onFile(file)
        // Сброс, чтобы повторный выбор того же файла снова сработал
        e.target.value = ''
      }}
    />
    <span className='border-foreground/70 bg-background flex size-11 shrink-0 items-center justify-center border-[1.5px]'>
      <UploadIcon
        className='size-5'
        aria-hidden
      />
    </span>
    <span className='min-w-0'>
      <Text
        as='span'
        className='block leading-tight'
      >
        {title}
      </Text>
      {hint && (
        <Text
          as='span'
          size='xs'
          tone='muted'
          className='mt-1 block'
        >
          {hint}
        </Text>
      )}
    </span>
  </label>
)
