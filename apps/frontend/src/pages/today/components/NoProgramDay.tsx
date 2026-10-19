import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography'

// Нет активной программы или в ней нет комплексов: бот не может предложить тренировку
export const NoProgramDay = () => (
  <>
    <Rise className='px-gutter'>
      <Lead>программы —</Lead>
      <Poster
        as='h1'
        size='hero'
        tone='primary'
        fit
      >
        нет
      </Poster>
      <Text
        tone='soft'
        className='mt-4'
      >
        Возьми готовый шаблон или собери свою — и бот будет выдавать тренировки по очереди.
      </Text>
    </Rise>
    <Rise className='grid grid-cols-2 gap-2 px-gutter'>
      <ButtonLink to={ROUTES.PROGRAMS}>Взять шаблон</ButtonLink>
      <ButtonLink
        to={ROUTES.PROGRAMS}
        variant='outline'
      >
        Собрать свою
      </ButtonLink>
    </Rise>
  </>
)
