import { SendIcon } from 'lucide-react'

import { type CatalogKind, usePublishEntry } from '@/entities/catalog'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type PublishEntryProps = {
  kind: CatalogKind
  entry: { id: number; mine: boolean; pendingReview: boolean; canPublish: boolean }
}

// Своя личная запись попадает в общий справочник только по явной кнопке и после проверки
export const PublishEntry = ({ kind, entry }: PublishEntryProps) => {
  const publish = usePublishEntry()

  if (!entry.mine) return null
  if (entry.pendingReview)
    return (
      <Text
        size='sm'
        tone='muted'
      >
        На проверке у администратора — бот напишет исход.
      </Text>
    )
  if (!entry.canPublish) return null
  return (
    <div className='flex flex-col gap-2'>
      <Text
        size='sm'
        tone='muted'
      >
        Видна только тебе. Опубликуй — после проверки появится в общем справочнике.
      </Text>
      <Button
        variant='share'
        disabled={publish.isPending}
        onClick={() => publish.mutate({ kind, id: entry.id })}
      >
        <SendIcon />
        Опубликовать
      </Button>
    </div>
  )
}
