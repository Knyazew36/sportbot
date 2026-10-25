import { View } from 'react-native';

import { type CatalogExercise, EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';

import { toAssetUrl } from '@/shared/api';
import { Badge } from '@/shared/ui/kit/Badge';
import { PhotoPair } from '@/shared/ui/kit/CatalogImage';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Poster } from '@/shared/ui/kit/Typography';
import { ImageCredit } from '@/widgets/catalog/ImageCredit';
import { PublishEntry } from '@/widgets/catalog/PublishEntry';
import { VideoLink } from '@/widgets/catalog/VideoLink';

// Верх карточки: поза старт/финиш с подписью автора фото, название, инвентарь, видео и статус публикации
export const ExerciseHero = ({ exercise: e }: { exercise: CatalogExercise }) => (
  <Rise className="px-gutter gap-4">
    <PhotoPair start={toAssetUrl(e.imageUrl) ?? null} end={toAssetUrl(e.imageEndUrl) ?? null} alt={e.name} />
    <ImageCredit credit={e.imageCredit} />
    <Poster size="2xl">{e.name}</Poster>
    {e.equipment || e.draft ? (
      <View className="flex-row flex-wrap gap-1.5">
        {e.equipment ? <Badge variant="secondary">{EQUIPMENT_LABEL[e.equipment]}</Badge> : null}
        {e.draft ? <Badge variant="outline">не проверено</Badge> : null}
      </View>
    ) : null}
    <VideoLink name={e.name} videoUrl={e.videoUrl} />
    <PublishEntry kind="exercise" entry={e} />
  </Rise>
);
