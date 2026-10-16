import { CodeXmlIcon } from 'lucide-react'

import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow } from '@/shared/ui/kit/Typography'

import { SectionTicket } from './SectionTicket'
import { ThanksLink } from './ThanksLink'

// Вход на страницу команды и «спасибо» звёздами: это не настройки, поэтому стоят после разделов, за пунктирной отбивкой
export const DeveloperTicket = () => (
  <Rise className='px-gutter'>
    <div className='flex flex-col gap-4 border-t-[1.5px] border-dashed border-current/45 pt-4'>
      <Eyebrow as='p'>Создатели</Eyebrow>
      <SectionTicket
        to={ROUTES.ME_DEVELOPER}
        icon={CodeXmlIcon}
        title='Разработчик'
        meta='KM Team · сделаем ваш проект'
      />
      <ThanksLink />
    </div>
  </Rise>
)
