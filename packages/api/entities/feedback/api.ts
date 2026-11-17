import { useMutation } from '@tanstack/react-query'

import { feedbackControllerCreate } from '../../generated/feedback/feedback'
import type { FeedbackValues } from './model/schemas'

/** Идея или проблема: команда получает её в мессенджер, ответ приходит туда же, где человек пользуется ботом */
export const useSendFeedback = () =>
  useMutation({
    mutationFn: (values: FeedbackValues) => feedbackControllerCreate(values),
    meta: { successMessage: 'Спасибо! Если что, напишем тебе в мессенджер', inlineFieldErrors: true },
  })
