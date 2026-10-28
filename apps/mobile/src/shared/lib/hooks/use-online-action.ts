import { useIsOnline } from '@/shared/api';

/**
 * Кнопка действия, которому нужен сервер (шаринг, публикация, фото, чужие программы).
 * Остальное приложение работает офлайн на базе телефона, а это без сети гасится с подсказкой —
 * иначе нажатие закончилось бы тостом ошибки
 */
export const useOnlineAction = () => {
  const online = useIsOnline();
  return {
    online,
    disabled: !online,
    label: (text: string) => (online ? text : `${text} · нужна сеть`),
  };
};
