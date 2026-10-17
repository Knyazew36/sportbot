import { useEffect, useState } from 'react'

import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/shared/ui/shadcn/carousel'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/shadcn/dialog'

import { Eyebrow } from './Typography'

type PhotoGalleryProps = {
  photos: { src: string; label?: string }[]
  /** Открытая фото; null — галерея закрыта */
  index: number | null
  onOpenChange: (open: boolean) => void
  alt: string
}

// Фото на весь экран со свайпом между ними: в карточке старт и финиш слишком мелкие, чтобы разглядеть положение
// Верх — под кнопками Telegram в полноэкранном режиме (--sb-top-inset), иначе крестик закрытия уйдёт под них
export const PhotoGallery = ({ photos, index, onOpenChange, alt }: PhotoGalleryProps) => {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const sync = () => setSelected(api.selectedScrollSnap())
    sync()
    api.on('select', sync)
    return () => {
      api.off('select', sync)
    }
  }, [api])

  return (
    <Dialog
      open={index != null}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='inset-x-0 top-(--sb-top-inset) bottom-0 flex max-w-none translate-x-0 translate-y-0 flex-col justify-center gap-4 border-0 p-0 shadow-none sm:max-w-none'>
        <DialogTitle className='sr-only'>{alt}</DialogTitle>
        <Carousel
          setApi={setApi}
          opts={{ startIndex: index ?? 0 }}
        >
          <CarouselContent>
            {photos.map(photo => (
              <CarouselItem
                key={photo.src}
                className='flex flex-col items-center gap-2'
              >
                <img
                  src={photo.src}
                  alt={photo.label ? `${alt}: ${photo.label.toLowerCase()}` : alt}
                  className='max-h-[calc(75dvh-var(--sb-top-inset))] w-full object-contain'
                />
                {photo.label && <Eyebrow>{photo.label}</Eyebrow>}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {photos.length > 1 && (
          <div className='flex justify-center gap-1.5'>
            {photos.map((photo, i) => (
              <span
                key={photo.src}
                className={i === selected ? 'bg-foreground size-2' : 'bg-foreground/25 size-2'}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
