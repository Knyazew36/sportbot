import { btn, msg } from '@/bot';
import { MessengerMessage } from '@/messengers';

/** «Только сегодня или в комплексе?» — общий шаг замены: из списка аналогов и после создания своего. */
export function swapChoiceMessage(
  itemId: number,
  exerciseId: number,
  intro?: string,
): MessengerMessage {
  return msg(
    [intro, 'Заменить только сегодня или в комплексе?']
      .filter(Boolean)
      .join('\n'),
    [
      [
        btn('Только сегодня', `sw:day:${itemId}:${exerciseId}`),
        btn('В комплексе', `sw:cx:${itemId}:${exerciseId}`),
      ],
      [btn('⬅️ К тренировке', 'wo:cont')],
    ],
  );
}
