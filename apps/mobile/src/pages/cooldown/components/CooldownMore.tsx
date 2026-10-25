import { View } from 'react-native';

import { Button } from '@/shared/ui/kit/Button';
import { Lanes } from '@/shared/ui/kit/Lanes';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownListSheet } from './CooldownSheets';

// Основной блок пройден: продолжить растяжками «если есть время» или уйти к итогу
export const CooldownMore = ({ flow }: { flow: CooldownFlow }) => (
  <Screen
    fullscreen
    header={
      <TopBar
        back={flow.finish}
        title="Заминка"
        subtitle="основной блок пройден"
      />
    }
    footer={
      <StickyFooter>
        <Button variant="outline" size="lg" onPress={flow.finish}>
          Нет
        </Button>
        <Button size="lg" onPress={() => flow.go(flow.cooldown.main.length)}>
          Да
        </Button>
      </StickyFooter>
    }
    className="grow px-gutter"
  >
    <Rise className="flex-1 justify-center">
      <Lead>есть время ещё —</Lead>
      <Poster size="display" tone="primary" className="mt-1">
        {`на ${flow.cooldown.optionalMinutes} мин?`}
      </Poster>
      <View className="mt-6 h-20">
        <Lanes className="opacity-30" />
      </View>
    </Rise>
    <CooldownListSheet flow={flow} />
  </Screen>
);
