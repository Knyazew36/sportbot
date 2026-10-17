import { useState } from 'react'

import { CatalogImage } from './CatalogImage'
import { PhotoGallery } from './PhotoGallery'
import { Eyebrow } from './Typography'

type PhotoPairProps = {
  start: string | null
  /** Финишное положение; нет — показываем одну крупную картинку, как раньше */
  end: string | null
  alt: string
}

// Картинка записи справочника: старт и финиш рядом, чтобы движение читалось без видео.
// Тап открывает галерею на весь экран
export const PhotoPair = ({ start, end, alt }: PhotoPairProps) => {
  const [open, setOpen] = useState<number | null>(null)
  const slots = end
    ? [
        { src: start, label: 'Старт' },
        { src: end, label: 'Финиш' },
      ]
    : [{ src: start, label: undefined }]
  // Заглушку без картинки в галерею не берём
  const photos = slots.flatMap(s => (s.src ? [{ src: s.src, label: s.label }] : []))

  const image = (slot: { src: string | null; label?: string }) => {
    const photoAlt = slot.label ? `${alt}: ${slot.label.toLowerCase()}` : alt
    if (!slot.src) {
      return (
        <CatalogImage
          src={null}
          alt={photoAlt}
          size='cover'
        />
      )
    }
    const src = slot.src
    return (
      <button
        type='button'
        aria-label='Открыть фото'
        onClick={() => setOpen(photos.findIndex(p => p.src === src))}
        className='block w-full'
      >
        <CatalogImage
          src={src}
          alt={photoAlt}
          size='cover'
        />
      </button>
    )
  }

  return (
    <>
      {end ? (
        <div className='grid grid-cols-2 gap-2'>
          {slots.map(slot => (
            <figure
              key={slot.label}
              className='flex flex-col gap-1'
            >
              {image(slot)}
              <Eyebrow as='figcaption'>{slot.label}</Eyebrow>
            </figure>
          ))}
        </div>
      ) : (
        image({ src: start })
      )}
      {photos.length > 0 && (
        <PhotoGallery
          photos={photos}
          index={open}
          onOpenChange={o => !o && setOpen(null)}
          alt={alt}
        />
      )}
    </>
  )
}
