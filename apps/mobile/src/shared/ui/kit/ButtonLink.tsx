import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { Button, type ButtonProps } from './Button';

type ButtonLinkProps = Omit<ButtonProps, 'onPress'> & {
  /** Экран приложения или внешний адрес (видео техники). string — для маршрутов, ещё не попавших в typed routes */
  href: Href | string | `https://${string}` | `http://${string}`;
  /** Заменить экран, а не положить поверх: «Начать» с главной не должно возвращать назад на неё */
  replace?: boolean;
  /** Перед переходом: закрыть шторку — она рисуется поверх всего стека и осталась бы на новом экране */
  onNavigate?: () => void;
};

const isExternal = (href: ButtonLinkProps['href']): href is `https://${string}` =>
  typeof href === 'string' && /^https?:\/\//.test(href);

// Переход — тоже действие, поэтому у ссылки та же рамка и тень, что у кнопки — порт shared/ui/kit/ButtonLink.tsx.
// Внешний адрес открывается во встроенном браузере, а не роутером
export const ButtonLink = ({ href, replace, onNavigate, ...props }: ButtonLinkProps) => (
  <Button
    {...props}
    onPress={() => {
      onNavigate?.();
      if (isExternal(href)) void WebBrowser.openBrowserAsync(href);
      else if (replace) router.replace(href as Href);
      else router.push(href as Href);
    }}
  />
);
