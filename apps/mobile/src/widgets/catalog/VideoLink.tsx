import { CirclePlay, Search } from 'lucide-react-native';

import { ButtonLink } from '@/shared/ui/kit/ButtonLink';

import { videoSearchUrl } from './video-search';

type VideoLinkProps = {
  name: string;
  /** Свой ролик записи; нет — ведём в поиск YouTube по названию */
  videoUrl?: string | null;
};

// Видео техники: свой ролик или поиск по названию на YouTube — порт VideoLink.tsx
export const VideoLink = ({ name, videoUrl }: VideoLinkProps) => (
  <ButtonLink
    href={(videoUrl || videoSearchUrl(name)) as `https://${string}`}
    variant="outline"
    size="sm"
    icon={videoUrl ? CirclePlay : Search}
    className="self-start"
  >
    {videoUrl ? 'Видео техники' : 'Найти видео на YouTube'}
  </ButtonLink>
);
