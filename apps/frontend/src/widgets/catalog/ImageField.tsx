import type { UseMutationResult } from '@tanstack/react-query'

import { useState } from 'react'

import { CATALOG_IMAGE_MAX_MB, CATALOG_IMAGE_TYPES, catalogImageFileSchema } from '@/entities/catalog'
import { toAssetUrl } from '@/shared/api'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { ErrorText } from '@/shared/ui/kit/ErrorText'
import { FileDrop } from '@/shared/ui/kit/FileDrop'

type UploadedImage = { imagePath: string; imageUrl: string }

type ImageFieldProps = {
  /** Текущая картинка записи — адрес для показа */
  initialUrl: string | null
  alt: string
  /** Загрузка файла: у админа и у правки пользователя разные эндпоинты */
  upload: Pick<UseMutationResult<UploadedImage, Error, File>, 'mutate' | 'isPending'>
  /** Путь загруженной картинки — в поле imagePath формы */
  onUploaded: (imagePath: string) => void
}

// Картинка записи: файл сразу уходит на сервер, в форму попадает только его путь
export const ImageField = ({ initialUrl, alt, upload, onUploaded }: ImageFieldProps) => {
  const [url, setUrl] = useState(initialUrl)
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      <CatalogImage
        src={toAssetUrl(url) ?? null}
        alt={alt}
        size='cover'
        emptyLabel='картинки пока нет'
      />
      <FileDrop
        accept={CATALOG_IMAGE_TYPES.join(',')}
        title={upload.isPending ? 'Загружаю…' : url ? 'Заменить картинку' : 'Загрузить картинку'}
        hint={`JPEG, PNG или WebP, до ${CATALOG_IMAGE_MAX_MB} МБ`}
        onFile={file => {
          const checked = catalogImageFileSchema.safeParse(file)
          setError(checked.success ? null : (checked.error.issues[0]?.message ?? 'Не подходит файл'))
          if (!checked.success) return
          upload.mutate(file, {
            onSuccess: image => {
              setUrl(image.imageUrl)
              onUploaded(image.imagePath)
            },
          })
        }}
      />
      <ErrorText errors={error} />
    </>
  )
}
