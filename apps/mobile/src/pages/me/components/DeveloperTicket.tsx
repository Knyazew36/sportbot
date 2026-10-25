import { View } from 'react-native';
import { CodeXml } from 'lucide-react-native';

import { routeHref, ROUTES } from '@/shared/config/routes';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { SectionTicket } from './SectionTicket';

// Вход на страницу команды — порт pages/me/components/DeveloperTicket.tsx: это не настройки, поэтому после
// разделов, за пунктирной отбивкой. «Спасибо» звёздами нет: звёзды есть только в Telegram
export const DeveloperTicket = () => (
  <Rise className="px-gutter">
    <View className="border-foreground/45 gap-4 border-t-[1.5px] border-dashed pt-4">
      <Eyebrow>Создатели</Eyebrow>
      <SectionTicket
        href={routeHref(ROUTES.ME_DEVELOPER)}
        icon={CodeXml}
        title="Разработчик"
        meta="KM Team · сделаем ваш проект"
      />
    </View>
  </Rise>
);
