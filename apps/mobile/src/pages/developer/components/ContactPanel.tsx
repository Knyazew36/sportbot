import { Linking, View } from 'react-native';
import { ArrowUpRight, Send } from 'lucide-react-native';

import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { InkPanel } from '@/shared/ui/kit/InkPanel';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography';

import { KM_TEAM_URL, TELEGRAM_HANDLE, TELEGRAM_URL } from '../model/developer';

// Главное действие страницы — написать напрямую; сайт команды — для тех, кто хочет сначала посмотреть работы.
// Telegram — системой, чтобы открылось приложение; сайт — во встроенном браузере
export const ContactPanel = () => (
  <Rise className="px-gutter">
    <InkPanel shadow className="gap-5 p-5">
      <View className="gap-2">
        <Eyebrow tone="inverseMuted">Есть идея или задача?</Eyebrow>
        <Poster size="xl">Напишите — обсудим</Poster>
        <Text tone="inverseMuted">Предложим решение, сроки и бюджет.</Text>
      </View>
      <View className="gap-3">
        <Button variant="paper" block spread iconRight={Send} onPress={() => void Linking.openURL(TELEGRAM_URL)}>
          {TELEGRAM_HANDLE}
        </Button>
        <ButtonLink href={KM_TEAM_URL} variant="paper" block spread iconRight={ArrowUpRight}>
          km-team.ru
        </ButtonLink>
      </View>
    </InkPanel>
  </Rise>
);
