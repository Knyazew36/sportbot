import { useMuscleLoad } from '@/entities/stats'
import { ROUTES } from '@/shared/config/paths'
import { Notice } from '@/shared/ui/kit/Notice'
import { Rise } from '@/shared/ui/kit/Reveal'

// Мышцы без подходов две недели — повод выбрать комплекс с ними. Нечего сказать — блока нет
export const ForgottenMuscles = () => {
  const load = useMuscleLoad(2)
  const forgotten = load.data?.filter(m => m.forgotten).map(m => m.name.toLowerCase()) ?? []
  if (!forgotten.length) return null

  return (
    <Rise className='px-gutter'>
      <Notice
        to={`${ROUTES.STATS}?tab=muscles`}
        kicker='давно не работали · 2 недели'
        description={forgotten.join(', ')}
      />
    </Rise>
  )
}
