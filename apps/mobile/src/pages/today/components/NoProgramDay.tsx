import { View } from 'react-native';

import { ROUTES } from '@/shared/config/routes';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Lead, Poster, Text } from '@/shared/ui/kit/Typography';

// Нет активной программы или в ней нет комплексов — порт NoProgramDay.tsx: бот не может предложить тренировку
export const NoProgramDay = () => (
  <>
    <Rise className="px-gutter">
      <Lead>программы —</Lead>
      <Poster size="hero" tone="primary" numberOfLines={1} adjustsFontSizeToFit>
        нет
      </Poster>
      <Text tone="soft" className="mt-4">
        Возьми готовый шаблон или собери свою — и бот будет выдавать тренировки по очереди.
      </Text>
    </Rise>
    <Rise className="flex-row gap-2 px-gutter">
      <View className="flex-1">
        <ButtonLink href={ROUTES.PROGRAMS} block>
          Взять шаблон
        </ButtonLink>
      </View>
      <View className="flex-1">
        <ButtonLink href={ROUTES.PROGRAMS} variant="outline" block>
          Собрать свою
        </ButtonLink>
      </View>
    </Rise>
  </>
);
