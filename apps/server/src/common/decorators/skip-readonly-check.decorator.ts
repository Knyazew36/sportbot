import { SetMetadata } from '@nestjs/common'

export const SKIP_READONLY_CHECK_KEY = 'skip_readonly_check'

/** Точечное исключение из SubscriptionActiveGuard сверх встроенного исключения путей billing/*, auth/*. */
export const SkipReadonlyCheck = () => SetMetadata(SKIP_READONLY_CHECK_KEY, true)
