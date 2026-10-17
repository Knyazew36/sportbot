import { CirclePlayIcon, SearchIcon } from 'lucide-react'

import { ButtonLink } from '@/shared/ui/kit/ButtonLink'

type VideoLinkProps = {
  name: string
  /** Свой ролик записи; нет — ведём в поиск YouTube по названию */
  videoUrl?: string | null
}

// Ссылку на поиск не храним в базе: она собирается из названия и сразу есть у каждой записи,
// включая черновики. Конкретный ролик админ ставит в videoUrl, и он заменяет поиск
const searchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} техника выполнения`)}`

// Видео техники: свой ролик или поиск по названию на YouTube
export const VideoLink = ({ name, videoUrl }: VideoLinkProps) => (
  <ButtonLink
    to={videoUrl || searchUrl(name)}
    variant='outline'
    size='sm'
    className='self-start'
  >
    {videoUrl ? <CirclePlayIcon /> : <SearchIcon />}
    {videoUrl ? 'Видео техники' : 'Найти видео на YouTube'}
  </ButtonLink>
)
