import { router, type Href } from 'expo-router';

import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { Lead, Poster } from '@/shared/ui/kit/Typography';

// На отработавшие мышцы растяжек не нашлось
export const CooldownEmpty = ({ back }: { back: Href }) => (
  <Screen
    fullscreen
    header={
      <TopBar
        back={() => router.replace(back)}
        title="Заминка"
      />
    }
    footer={
      <StickyFooter>
        <ButtonLink href={back} replace size="lg">
          К итогу
        </ButtonLink>
      </StickyFooter>
    }
    className="px-gutter"
  >
    <Rise>
      <Lead>растяжек под эту тренировку —</Lead>
      <Poster size="display" tone="primary">
        нет
      </Poster>
      <Lead size="md" tone="soft" className="mt-3">
        На мышцы, которые работали, подходящих растяжек нет.
      </Lead>
    </Rise>
  </Screen>
);
