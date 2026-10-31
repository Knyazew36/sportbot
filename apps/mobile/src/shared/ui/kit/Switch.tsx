import { Switch as RNSwitch } from 'react-native';

import { haptic } from '@/shared/lib/haptics';
import { useTheme } from '@/shared/theme/ThemeProvider';

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

// Переключатель настройки — порт animate-ui Switch фронта: системный RN Switch в цветах темы.
// Красим стилем, а не классом: дорожку и бегунок RN рисует сам
export const Switch = ({ value, onValueChange, disabled, accessibilityLabel }: SwitchProps) => {
  const { colors, scheme } = useTheme();
  // В тёмной теме hatch почти равен фону — выключенная дорожка пропадает, берём светлее
  const offTrack = scheme === 'dark' ? colors.smoke : colors.hatch;
  return (
    <RNSwitch
      value={value}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      onValueChange={(next) => {
        haptic.tap();
        onValueChange(next);
      }}
      trackColor={{ true: colors.blue, false: offTrack }}
      ios_backgroundColor={offTrack}
      thumbColor={colors.paper}
    />
  );
};
