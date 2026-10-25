import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Lead, Poster, Text } from '@/shared/ui/kit/Typography';

export const DeveloperHero = () => (
  <Rise className="px-gutter gap-3">
    <Eyebrow tone="primary">KM Team</Eyebrow>
    <Lead size="md">это приложение сделали мы —</Lead>
    <Poster size="3xl">Сделаем и для вас</Poster>
    <Text tone="soft">
      Придумываем, проектируем и запускаем цифровые продукты под задачу бизнеса: от бота до большой платформы. Если это
      можно сделать в коде — мы это сделаем.
    </Text>
  </Rise>
);
