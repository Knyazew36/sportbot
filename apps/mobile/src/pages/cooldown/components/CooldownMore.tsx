import { View } from 'react-native';

import { Button } from '@/shared/ui/kit/Button';
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
    className="px-gutter"
  >
    <View className="flex flex-1 flex-col justify-center">
      <Lead>есть время ещё —</Lead>
      <Poster size="display" tone="primary" className="mt-1">
        на {flow.cooldown.optionalMinutes} мин?
      </Poster>
    </View>
    <CooldownListSheet flow={flow} />
  </Screen>
);
