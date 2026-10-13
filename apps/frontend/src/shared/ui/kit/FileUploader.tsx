import { CheckIcon, ImageIcon, LoaderIcon, RotateCwIcon, TriangleAlertIcon, UploadIcon } from 'lucide-react'

import { useState } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

export type UploadFile = {
  id: string
  name: string
  size: string
  state: 'uploaded' | 'uploading' | 'failed'
  progress?: number
}

type FileUploaderProps = {
  files: UploadFile[]
  required?: boolean
  hint?: string
  readOnly?: boolean
  className?: string
}

// У каждого файла своё состояние: неуспешная загрузка не считается принятой
export const FileUploader = ({ files: initial, required, hint, readOnly, className }: FileUploaderProps) => {
  const [files, setFiles] = useState(initial)
  const uploaded = files.filter(file => file.state === 'uploaded').length

  const retry = (id: string) =>
    setFiles(prev => prev.map(file => (file.id === id ? { ...file, state: 'uploading', progress: 35 } : file)))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!readOnly && (
        <label className='border-ash focus-within:border-foreground hover:border-foreground hover:bg-mist flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-[1.5px] border-dashed px-6 py-8 text-center transition-colors'>
          <input
            type='file'
            accept='image/*'
            multiple
            className='sr-only'
          />
          <span className='bg-mist flex size-12 items-center justify-center rounded-full'>
            <UploadIcon
              className='size-5'
              aria-hidden
            />
          </span>
          <span className='text-body-sm font-medium'>Добавить фото</span>
          <span className='mono-label text-smoke'>
            {hint ?? 'JPG, PNG, HEIC'}
            {required && ' · фото обязательно для сдачи'}
          </span>
        </label>
      )}
      {files.length > 0 && (
        <ul className='flex flex-col gap-1.5'>
          {files.map(file => (
            <li
              key={file.id}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-3 py-2.5',
                file.state === 'failed' ? 'bg-destructive/10' : 'bg-mist',
              )}
            >
              <span className='bg-card flex size-9 shrink-0 items-center justify-center rounded-xl'>
                <ImageIcon
                  className='text-slate size-4'
                  aria-hidden
                />
              </span>
              <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='text-body-sm truncate font-medium'>{file.name}</span>
                {file.state === 'uploading' ? (
                  <div className='bg-ash/50 h-1 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-foreground h-full rounded-full'
                      style={{ width: `${file.progress ?? 50}%` }}
                    />
                  </div>
                ) : (
                  <span className={cn('mono-label', file.state === 'failed' ? 'text-destructive' : 'text-smoke')}>
                    {file.state === 'failed' ? 'Не загружено · нет сети' : file.size}
                  </span>
                )}
              </div>
              {file.state === 'uploaded' && (
                <span className='text-caption flex items-center gap-1 font-medium'>
                  <CheckIcon
                    className='size-3.5'
                    aria-hidden
                  />{' '}
                  Загружено
                </span>
              )}
              {file.state === 'uploading' && (
                <span className='text-caption text-slate flex items-center gap-1'>
                  <LoaderIcon
                    className='size-3.5 animate-spin'
                    aria-hidden
                  />{' '}
                  {file.progress ?? 50}%
                </span>
              )}
              {file.state === 'failed' && (
                <Button
                  size='xs'
                  variant='outline'
                  onClick={() => retry(file.id)}
                >
                  <RotateCwIcon /> Повторить
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {required && uploaded === 0 && (
        <p className='text-caption text-slate flex items-center gap-1.5'>
          <TriangleAlertIcon
            className='size-3.5'
            aria-hidden
          />
          Без загруженного фото задачу нельзя отправить на проверку
        </p>
      )}
    </div>
  )
}
