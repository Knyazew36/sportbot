import * as WebBrowser from 'expo-web-browser';

import type { ImageCreditResponseDto } from '@sportbot/api/generated/model';

import { Text } from '@/shared/ui/kit/Typography';

// Подпись под фото: CC BY и CC BY-SA обязывают указать автора, лицензию и источник — порт ImageCredit.tsx
export const ImageCredit = ({ credit }: { credit: ImageCreditResponseDto | null }) => {
  if (!credit) return null;
  const label = [credit.author, credit.license].filter(Boolean).join(' · ');
  const source = credit.source;
  return (
    <Text
      size="2xs"
      tone="muted"
      onPress={source ? () => void WebBrowser.openBrowserAsync(source) : undefined}
      className={source ? 'underline' : undefined}
    >
      Фото: {label}
    </Text>
  );
};
