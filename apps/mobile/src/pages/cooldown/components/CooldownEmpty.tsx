import { View } from 'react-native';
import type { Href } from 'expo-router';

import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

// На отработавшие мышцы растяжек не нашлось
export const CooldownEmpty = ({ back }: { back: Href }) => (
  <Screen
    fullscreen
    header={
      <TopBar
        back={() => {}}
        title="Заминка"
      />
    }
    footer={
      <View className="border-border bg-background px-gutter border-t-[1.5px] pt-3 pb-4">
        <ButtonLink href={back} replace size="lg" block>
          К итогу
        </ButtonLink>
      </View>
    }
    className="px-gutter"
  >
    <View>
      <Lead>растяжек под эту тренировку —</Lead>
      <Poster size="display" tone="primary">
        нет
      </Poster>
      <Lead size="md" tone="soft" className="mt-3">
        На мышцы, которые работали, подходящих растяжек нет.
      </Lead>
    </View>
  </Screen>
);
