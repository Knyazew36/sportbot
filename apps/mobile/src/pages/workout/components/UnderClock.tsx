import { View } from 'react-native'

import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

// Подпись под цифрами вне потока и по центру — замена left-1/2 -translate-x-1/2 фронта: процентный сдвиг
// в Uniwind ненадёжен, поэтому top: 100% — стилем RN. Края шире цифр, чтобы длинная подпись не переносилась.
// -mt-2: у цифр плакатного шрифта пустое место под строкой, без него подпись отрывается от таймера
export const UnderClock = ({ children, className }: { children: ReactNode; className?: string }) => (
  <View
    pointerEvents='none'
    style={{ top: '100%' }}
    className={cn('absolute -right-24 -left-24 -mt-4 items-center', className)}
  >
    {children}
  </View>
)
