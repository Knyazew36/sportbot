import { useMutation } from '@tanstack/react-query'

import type { StarPaymentPurpose } from '@/shared/api/generated/model'
import { starsControllerCreate } from '@/shared/api/generated/stars/stars'
import { type InvoiceStatus, openStarsInvoice } from '@/shared/miniapp'

/**
 * Оплата звёздами Telegram под любое назначение (purpose): счёт на сервере → окно оплаты Telegram → его итог.
 * Отмена окна — не ошибка, вернётся 'cancelled'. Списание фиксирует бот (successful_payment), не этот хук
 */
export const usePayStars = (purpose: StarPaymentPurpose) =>
  useMutation({
    mutationFn: async (amount: number): Promise<InvoiceStatus> => {
      const { invoiceUrl } = await starsControllerCreate({ amount, purpose })
      const status = await openStarsInvoice(invoiceUrl)
      if (status === 'failed') throw new Error('Оплата не прошла. Попробуйте ещё раз')
      return status
    },
    // Итог виден на экране: после 'paid' потребитель показывает благодарность, после отмены форма остаётся как была
    meta: { skipSuccessToast: true },
  })
