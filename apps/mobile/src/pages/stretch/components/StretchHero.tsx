import { View } from 'react-native';

import type { CatalogStretch } from '@sportbot/api/entities/catalog';
import { useDeleteStretchExclusion, useIsStretchExcluded } from '@/shared/local/entities/profile';
import { toAssetUrl } from '@/shared/api';
import { Badge } from '@/shared/ui/kit/Badge';
import { Button } from '@/shared/ui/kit/Button';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Poster, Text } from '@/shared/ui/kit/Typography';
import { ImageCredit } from '@/widgets/catalog/ImageCredit';
import { PublishEntry } from '@/widgets/catalog/PublishEntry';
import { VideoLink } from '@/widgets/catalog/VideoLink';

// Верх карточки: поза, название, что тянет, исключена ли из заминки, видео и статус публикации
export const StretchHero = ({ stretch: st }: { stretch: CatalogStretch }) => {
  const excluded = useIsStretchExcluded(st.id);
  const restore = useDeleteStretchExclusion();

  return (
    <Rise className="px-gutter gap-4">
      <PhotoPair start={toAssetUrl(st.imageUrl) ?? null} end={toAssetUrl(st.imageEndUrl) ?? null} alt={st.name} />
      <ImageCredit credit={st.imageCredit} />
      <Poster size="2xl">{st.name}</Poster>
      {st.feel && <Text tone="soft">Тянет: {st.feel}</Text>}
      {st.draft && <Badge variant="outline">не проверено</Badge>}
      {excluded && (
        <View className="flex-row items-center justify-between gap-3">
          <Text tone="muted">Не предлагается в заминке</Text>
          <Button variant="outline" size="xs" loading={restore.isPending} onPress={() => restore.mutate(st.id)}>
            Вернуть
          </Button>
        </View>
      )}
      <VideoLink name={st.name} videoUrl={st.videoUrl} />
      <PublishEntry kind="stretch" entry={st} />
    </Rise>
  );
};
