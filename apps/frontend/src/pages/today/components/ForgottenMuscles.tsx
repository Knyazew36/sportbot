import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useMuscleLoad } from '@/entities/stats'
import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

// Мышцы без подходов две недели — повод выбрать комплекс с ними. Нечего сказать — блока нет
export const ForgottenMuscles = () => {
  const load = useMuscleLoad(2)
  const forgotten = load.data?.filter(m => m.forgotten).map(m => m.name.toLowerCase()) ?? []
  if (!forgotten.length) return null

  return (
    <Rise className='px-gutter'>
      <Link
        to={ROUTES.STATS}
        className='hatch border-border flex items-center gap-3 border-[1.5px] p-3'
      >
        <div className='bg-background min-w-0 flex-1'>
          <Eyebrow as='p'>Давно не работали · 2 недели</Eyebrow>
          <Text className='mt-1'>{forgotten.join(', ')}</Text>
        </div>
        <ChevronRightIcon className='text-foreground/40 size-5 shrink-0' />
      </Link>
    </Rise>
  )
}
