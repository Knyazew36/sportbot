import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'
import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { buildPath, ROUTES } from '@/shared/config/paths'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { VideoThumb } from '@/widgets/video-preview/VideoThumb'

import { EDITORS } from '../editors'

// Карточка ролика в хабе: как он выглядит (на примере из контракта), что это, и переход к форме
export const CompositionCard = ({ id }: { id: CompositionId }) => {
  const { title, example } = COMPOSITIONS[id]
  return (
    <li>
      <Link
        to={buildPath(ROUTES.ME_EDITOR_COMPOSITION, { compositionId: id })}
        className='border-foreground bg-card hover:border-primary flex flex-col border-[1.5px] transition-[border-color,box-shadow] hover:shadow-[3px_3px_0_var(--sb-blue)]'
      >
        <VideoThumb
          compositionId={id}
          props={example as CompositionProps<typeof id>}
          className='border-foreground border-b-[1.5px]'
        />
        <div className='flex items-center gap-3 p-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <Poster
              as='h3'
              size='sm'
            >
              {title}
            </Poster>
            <Text
              size='sm'
              tone='muted'
            >
              {EDITORS[id].hint}
            </Text>
          </div>
          <ChevronRightIcon className='text-foreground/40 size-5 shrink-0' />
        </div>
      </Link>
    </li>
  )
}
