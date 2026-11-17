import { z } from 'zod'

export const feedbackSchema = z.object({
  text: z.string().trim().min(5, 'Напиши хотя бы пару слов').max(1000, 'До 1000 символов'),
})
export type FeedbackValues = z.infer<typeof feedbackSchema>
