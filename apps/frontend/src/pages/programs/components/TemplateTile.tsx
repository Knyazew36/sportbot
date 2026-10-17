import { Link } from 'react-router'

import { addedText, catalogItemPath, catalogSourceOf, type Program } from '@/entities/program'
import { toAssetUrl } from '@/shared/api'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { haptic } from '@/shared/miniapp'
import { PersonAvatar } from '@/shared/ui/kit/PersonAvatar'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

// Плитка горизонтальной ленты: «От сообщества», подборка на экране программ. Автор — сверху, как подпись под
// афишей: в ленте сообщества важно, кто собрал. Жёсткая тень, как у кнопок и билетов, — «сюда можно тыкать».
// Только открыть — брать решают на странице программы, посмотрев состав
export const TemplateTile = ({ template: t }: { template: Program }) => (
  <li className='w-60 shrink-0 pr-[3px] pb-[3px]'>
    <Link
      to={catalogItemPath(t.id, catalogSourceOf(t))}
      onClick={() => haptic.tap()}
      className='border-foreground bg-card relative flex h-full flex-col gap-2.5 overflow-hidden border-[1.5px] p-3 shadow-[3px_3px_0_var(--sb-ink)] transition-[translate,box-shadow] duration-100 outline-none focus-visible:ring-4 focus-visible:ring-ring/25 active:translate-[3px] active:shadow-none'
    >
      {/* Растровый угол — фирменная фактура плаката, гаснет к центру плитки */}
      <span className='sb-halftone pointer-events-none absolute -top-2 -right-2 size-20 opacity-40 [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]' />
      {t.author && (
        <div className='relative flex items-center gap-2'>
          <PersonAvatar
            name={t.author.name}
            src={toAssetUrl(t.author.avatarUrl)}
            size='sm'
          />
          <Text
            size='sm'
            tone='muted'
            className='truncate'
          >
            {t.author.name}
          </Text>
        </div>
      )}
      <Poster
        as='h3'
        size='md'
        className='relative line-clamp-2'
      >
        {t.name}
      </Poster>
      {!t.author && t.description && (
        <Text
          size='sm'
          tone='soft'
          className='line-clamp-2'
        >
          {t.description}
        </Text>
      )}
      <div className='mt-auto flex flex-wrap gap-1.5'>
        {t.tags.slice(0, 3).map(tg => (
          <Badge key={tg.id}>{tg.name}</Badge>
        ))}
      </div>
      <Eyebrow>
        {pluralize(t.complexes.length, ['комплекс', 'комплекса', 'комплексов'])}
        {t.addedCount > 0 && ` · ${addedText(t.addedCount)}`}
      </Eyebrow>
    </Link>
  </li>
)
