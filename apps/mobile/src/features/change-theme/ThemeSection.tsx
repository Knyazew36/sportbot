import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Text } from '@/shared/ui/kit/Typography';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { PALETTES, THEME_OPTIONS } from './options';

// Оформление — порт features/change-theme/ThemeSection.tsx: расцветку подбирает пол, здесь её меняют вручную;
// схема от неё независима. «Авто» — как в системе телефона (во фронте — как в мессенджере). Применяется сразу
export const ThemeSection = () => {
  const { palette, setPalette, choice, setChoice } = useTheme();

  return (
    <ScreenSection>
      <Segmented options={PALETTES} value={palette} onValueChange={setPalette} stretch />
      <Segmented options={THEME_OPTIONS} value={choice} onValueChange={setChoice} stretch />
      <Text size="xs" tone="muted">
        {choice === 'auto' ? 'Тема как в системе телефона' : 'Своя тема в приложении — система её не меняет'}
      </Text>
    </ScreenSection>
  );
};
