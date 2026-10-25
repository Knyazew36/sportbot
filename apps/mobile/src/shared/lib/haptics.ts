import * as Haptics from 'expo-haptics';

// Вибрация вместе с тостами и действиями — как haptic во фронте (WebApp.HapticFeedback)
const impact = (style: Haptics.ImpactFeedbackStyle) => {
  void Haptics.impactAsync(style);
};

export const haptic = {
  tap: () => impact(Haptics.ImpactFeedbackStyle.Light),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
