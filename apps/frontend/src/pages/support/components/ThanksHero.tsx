import { StarIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'

// Золотая «медаль»: пунктирное кольцо — тот же язык, что линия отрыва у билетов. Звезда один раз
// покачивается при появлении, как медаль на ленте; при «уменьшить движение» стоит ровно
const Medal = () => {
  const still = useReducedMotion()
  return (
    <span className='text-sb-gold relative grid size-[88px] place-items-center'>
      <span className='absolute inset-0 rounded-full border-[1.5px] border-dashed border-current' />
      <span className='bg-sb-gold-tint absolute inset-2.5 rounded-full border-[1.5px] border-current' />
      <motion.span
        className='relative'
        initial={still ? false : { rotate: -18, scale: 0.6 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 9, delay: 0.15 }}
      >
        <StarIcon
          className='size-9 fill-current'
          strokeWidth={2}
        />
      </motion.span>
    </span>
  )
}

export const ThanksHero = () => (
  <Rise className='px-gutter flex flex-col gap-4'>
    <Medal />
    <div className='flex flex-col gap-3'>
      <Eyebrow
        as='p'
        tone='inherit'
        className='text-sb-gold'
      >
        от тех, кто тренируется
      </Eyebrow>
      <Poster
        as='h1'
        size='3xl'
      >
        Спасибо — звездой
      </Poster>
      <Text tone='soft'>
        Если бот помог не пропустить тренировку или дотянуть серию — можно передать команде спасибо. Приложение и так
        остаётся бесплатным, без подписок и рекламы.
      </Text>
    </div>
  </Rise>
)
