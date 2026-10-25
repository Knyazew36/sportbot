import { ArrowRightIcon } from 'lucide-react'

import type { AdminComplaint } from '@sportbot/api/entities/admin'
import { toAssetUrl } from '@/shared/api'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

type ProposalDiffProps = {
  changes: AdminComplaint['changes']
  alt: string
}

// Правка пользователя построчно: «было → стало». Картинки — миниатюрами рядом
export const ProposalDiff = ({ changes, alt }: ProposalDiffProps) => (
  <dl className='flex flex-col gap-3'>
    {changes.map(c => (
      <div
        key={c.field}
        className='flex flex-col gap-1'
      >
        <Eyebrow as='dt'>{c.title}</Eyebrow>
        {c.field === 'imagePath' ? (
          <dd className='grid grid-cols-[1fr_auto_1fr] items-center gap-2'>
            <CatalogImage
              src={toAssetUrl(c.before) ?? null}
              alt={alt}
              size='cover'
            />
            <ArrowRightIcon
              className='text-muted-foreground size-4'
              aria-hidden
            />
            <CatalogImage
              src={toAssetUrl(c.after) ?? null}
              alt={alt}
              size='cover'
            />
          </dd>
        ) : (
          // Шаги и ошибки приходят нумерованными строками — переносы сохраняем
          <dd className='flex flex-col gap-0.5 whitespace-pre-line'>
            <Text
              size='sm'
              tone='muted'
              className='line-through decoration-1'
            >
              {c.before ?? '—'}
            </Text>
            <Text size='sm'>{c.after ?? '—'}</Text>
          </dd>
        )}
      </div>
    ))}
  </dl>
)
