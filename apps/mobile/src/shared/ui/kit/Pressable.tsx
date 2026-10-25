import { Pressable as RNPressable, type PressableProps } from 'react-native';

// RN Pressable включает «нажато» в момент касания. В списке палец, начавший скролл, успевает
// посадить кнопку — анимация играет без нажатия. Задержка как у старых Touchable в ScrollView:
// если за это время начался скролл, «нажато» не включается. Короткий тап всё равно покажет посадку
const PRESS_DELAY_MS = 130;

export const Pressable = ({ unstable_pressDelay = PRESS_DELAY_MS, ...props }: PressableProps) => (
  <RNPressable unstable_pressDelay={unstable_pressDelay} {...props} />
);
