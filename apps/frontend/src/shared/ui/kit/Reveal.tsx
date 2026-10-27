import type { ReactNode } from 'react'

// Анимацию входа снизу убрали: обёртки оставлены, чтобы не трогать раскладку экранов
export const Stagger = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
)

export const Rise = ({ children, className }: { children?: ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
)
