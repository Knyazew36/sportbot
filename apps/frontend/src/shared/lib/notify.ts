import { getApiErrorMessage } from '@/shared/api'
import { toast } from '@/shared/ui/shadcn/toast'

// Короткие уведомления по итогам мутаций: onSuccess: notifySuccess('Сохранено'), onError: notifyError
export const notifySuccess = (title: string) => () => toast.add({ title, type: 'success' })

export const notifyError = (error: unknown) => toast.add({ title: getApiErrorMessage(error), type: 'error' })
