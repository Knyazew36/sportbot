import { CatalogImage } from './CatalogImage'
import { Eyebrow } from './Typography'

type PhotoPairProps = {
  start: string | null
  /** Финишное положение; нет — показываем одну крупную картинку, как раньше */
  end: string | null
  alt: string
}

// Картинка записи справочника: старт и финиш рядом, чтобы движение читалось без видео
export const PhotoPair = ({ start, end, alt }: PhotoPairProps) =>
  end ? (
    <div className='grid grid-cols-2 gap-2'>
      {[
        { src: start, label: 'Старт' },
        { src: end, label: 'Финиш' },
      ].map(photo => (
        <figure
          key={photo.label}
          className='flex flex-col gap-1'
        >
          <CatalogImage
            src={photo.src}
            alt={`${alt}: ${photo.label.toLowerCase()}`}
            size='cover'
          />
          <Eyebrow as='figcaption'>{photo.label}</Eyebrow>
        </figure>
      ))}
    </div>
  ) : (
    <CatalogImage
      src={start}
      alt={alt}
      size='cover'
    />
  )
