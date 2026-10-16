import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography'

export const SupportHero = () => (
  <Rise className='px-gutter flex flex-col gap-3'>
    <Eyebrow
      as='p'
      tone='primary'
    >
      KM Team
    </Eyebrow>
    <Lead size='md'>нравится тренироваться с ботом?</Lead>
    <Poster
      as='h1'
      size='3xl'
    >
      Поддержи разработчика
    </Poster>
    <Text tone='soft'>
      Приложение бесплатное и без рекламы. Звёзды Telegram помогают платить за сервер и делать новые функции.
    </Text>
  </Rise>
)
