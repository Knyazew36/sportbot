import { cn } from '@/shared/lib/utils'

// Точка «идёт»: тот же знак, что у записи на табло — время тикает, даже когда подход на паузе.
// Цвет — от текста (text-*), по умолчанию синий
export const LiveDot = ({ className }: { className?: string }) => (
  <span
    aria-hidden
    className={cn('text-primary relative inline-flex size-1.5 shrink-0', className)}
  >
    <span className='absolute inset-0 animate-ping rounded-full bg-current opacity-60 motion-reduce:hidden' />
    <span className='relative size-full rounded-full bg-current' />
  </span>
)
