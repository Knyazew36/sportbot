import { useState } from 'react'

import { useUploadCatalogImage } from '@/entities/admin'
import { toAssetUrl } from '@/shared/api'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { FileDrop } from '@/shared/ui/kit/FileDrop'

type ImageFieldProps = {
  /** Текущая картинка записи — адрес для показа */
  initialUrl: string | null
  alt: string
  /** Путь загруженной картинки — в поле imagePath формы */
  onUploaded: (imagePath: string) => void
}

// Картинка записи: файл сразу уходит на сервер, в форму попадает только его путь
export const ImageField = ({ initialUrl, alt, onUploaded }: ImageFieldProps) => {
  const upload = useUploadCatalogImage()
  const [url, setUrl] = useState(initialUrl)

  return (
    <>
      <CatalogImage
        src={toAssetUrl(url) ?? null}
        alt={alt}
        size='cover'
      />
      <FileDrop
        accept='image/jpeg,image/png,image/webp'
        title={upload.isPending ? 'Загружаю…' : url ? 'Заменить картинку' : 'Загрузить картинку'}
        hint='JPEG, PNG или WebP, до 5 МБ'
        onFile={file =>
          upload.mutate(file, {
            onSuccess: image => {
              setUrl(image.imageUrl)
              onUploaded(image.imagePath)
            },
          })
        }
      />
    </>
  )
}
