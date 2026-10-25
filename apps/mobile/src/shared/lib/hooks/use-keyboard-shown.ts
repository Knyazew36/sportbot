import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// iOS сообщает заранее (will), Android — только по факту (did): на нём will-событий нет
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Открыта ли экранная клавиатура */
export const useKeyboardShown = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(SHOW, () => setShown(true));
    const hide = Keyboard.addListener(HIDE, () => setShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return shown;
};
