/** Назначения платежа звёздами. Новое назначение — новый ключ здесь и его тексты счёта в STAR_PURPOSE_INVOICE */
export const STAR_PAYMENT_PURPOSES = ['donation'] as const;

export type StarPaymentPurpose = (typeof STAR_PAYMENT_PURPOSES)[number];

/** Название (до 32 символов) и описание (до 255) счёта, как их покажет окно оплаты Telegram */
export const STAR_PURPOSE_INVOICE: Record<
  StarPaymentPurpose,
  { title: string; description: string }
> = {
  donation: {
    title: 'Поддержка разработчика',
    description:
      'Звёзды уходят команде, которая делает приложение: на сервер, бота и новые функции. Спасибо!',
  },
};

export const STAR_AMOUNT_MIN = 1;
export const STAR_AMOUNT_MAX = 10000;

/** payload счёта — id записи StarPayment: по нему бот находит платёж в pre_checkout_query и successful_payment */
const PAYLOAD_PREFIX = 'sp:';

export const toStarPayload = (id: number): string => `${PAYLOAD_PREFIX}${id}`;

export const parseStarPayload = (payload: string): number | null => {
  if (!payload.startsWith(PAYLOAD_PREFIX)) return null;
  const id = Number(payload.slice(PAYLOAD_PREFIX.length));
  return Number.isInteger(id) && id > 0 ? id : null;
};
