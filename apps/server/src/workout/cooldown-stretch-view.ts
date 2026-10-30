import { imageCredit } from '@/catalog/dto/image-credit.response.dto';
import { StretchFull } from '@/catalog/catalog.service';

import { CooldownStretchResponseDto } from './dto/cooldown-stretch.response.dto';

/** Растяжка для экрана прохождения: общая у заминки и комплекса. */
export const cooldownStretchView = (
  stretch: StretchFull,
  toUrl: (path: string | null) => string | null,
): CooldownStretchResponseDto => ({
  id: stretch.id,
  name: stretch.name,
  howTo: stretch.howTo,
  steps: stretch.steps,
  mistakes: stretch.mistakes,
  imageUrl: toUrl(stretch.imagePath),
  imageEndUrl: toUrl(stretch.imageEndPath),
  feel: stretch.feel,
  videoUrl: stretch.videoUrl,
  imageCredit: imageCredit(stretch),
  holdSeconds: stretch.holdSeconds,
  perSide: stretch.perSide,
  muscles: stretch.muscles.map((m) => m.muscle.name).join(' · '),
});
