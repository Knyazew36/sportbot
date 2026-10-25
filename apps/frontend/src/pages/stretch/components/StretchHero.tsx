import type { CatalogStretch } from '@sportbot/api/entities/catalog'
import { useDeleteStretchExclusion, useIsStretchExcluded } from '@sportbot/api/entities/stretch-exclusion'
import { toAssetUrl } from '@/shared/api'
import { PhotoPair } from '@/shared/ui/kit/PhotoPair'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ImageCredit } from '@/widgets/catalog/ImageCredit'
import { PublishEntry } from '@/widgets/catalog/PublishEntry'
import { VideoLink } from '@/widgets/catalog/VideoLink'

// Верх карточки: поза, название, что тянет, исключена ли из заминки, видео и статус публикации
export const StretchHero = ({ stretch: st }: { stretch: CatalogStretch }) => {
  const excluded = useIsStretchExcluded(st.id)
  const restore = useDeleteStretchExclusion()

  return (
    <Rise className='px-gutter flex flex-col gap-4'>
      <PhotoPair
        start={toAssetUrl(st.imageUrl) ?? null}
        end={toAssetUrl(st.imageEndUrl) ?? null}
        alt={st.name}
      />
      <ImageCredit credit={st.imageCredit} />
      <Poster
        as='h1'
        size='2xl'
        className='hyphens-auto'
      >
        {st.name}
      </Poster>
      {st.feel && <Text tone='soft'>Тянет: {st.feel}</Text>}
      {st.draft && (
        <Badge
          variant='outline'
          className='self-start'
        >
          не проверено
        </Badge>
      )}
      {excluded && (
        <div className='flex items-center justify-between gap-3'>
          <Text tone='muted'>Не предлагается в заминке</Text>
          <Button
            variant='outline'
            size='xs'
            disabled={restore.isPending}
            onClick={() => restore.mutate(st.id)}
          >
            Вернуть
          </Button>
        </div>
      )}
      <VideoLink
        name={st.name}
        videoUrl={st.videoUrl}
      />
      <PublishEntry
        kind='stretch'
        entry={st}
      />
    </Rise>
  )
}
