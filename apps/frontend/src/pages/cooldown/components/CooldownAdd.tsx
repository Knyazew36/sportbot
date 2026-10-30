import { DicesIcon } from 'lucide-react'

import { useMuscles } from '@sportbot/api/entities/catalog'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import type { CooldownFlow } from '../model/use-cooldown-flow'

// Заминка показалась короткой или хочется лучше растянуть мышцу: случайная растяжка или на выбранную мышцу
export const CooldownAdd = ({ flow }: { flow: CooldownFlow }) => {
  const muscles = useMuscles()
  return (
    <div className='flex flex-col gap-3'>
      <Button
        variant='outline'
        size='lg'
        className='w-full'
        disabled={flow.addPending}
        onClick={() => flow.addStretch()}
      >
        <DicesIcon className='size-6' />
        Случайная растяжка
      </Button>
      <Eyebrow as='p'>или на мышцу</Eyebrow>
      <div className='flex flex-wrap gap-2'>
        {muscles.data?.map(muscle => (
          <Button
            key={muscle.id}
            variant='outline'
            size='xs'
            disabled={flow.addPending}
            onClick={() => flow.addStretch(muscle.id)}
          >
            {muscle.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
