import { ImageOffIcon } from 'lucide-react'

import { useState } from 'react'

import { cn } from '@/shared/lib/utils'

import { Eyebrow } from './Typography'

type CatalogImageProps = {
  src: string | null
  alt: string
  /** Миниатюра в списке или крупная картинка карточки */
  size?: 'thumb' | 'cover'
  className?: string
}

// Картинка упражнения или растяжки. Картинки добавляет админ при модерации, поэтому у черновиков
// и части записей её нет — тогда растровая заглушка, а не пустое место (frontend-tz, 11.4)
export const CatalogImage = ({ src, alt, size = 'thumb', className }: CatalogImageProps) => {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div
      className={cn(
        'border-foreground/80 relative shrink-0 overflow-hidden border-[1.5px] bg-white',
        size === 'thumb' ? 'size-14' : 'aspect-[4/3] w-full',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading='lazy'
          onError={() => setFailed(true)}
          className='size-full object-cover mix-blend-multiply'
        />
      ) : (
        <div className='bg-background sb-halftone flex size-full items-center justify-center opacity-90'>
          <span className='bg-background text-foreground/45 flex items-center gap-1.5 px-1.5 py-1'>
            <ImageOffIcon className={size === 'thumb' ? 'size-4' : 'size-5'} />
            {size === 'cover' && <Eyebrow tone='inherit'>картинку добавит админ</Eyebrow>}
          </span>
        </div>
      )}
    </div>
  )
}
