import { useWorkoutElapsed } from '@/shared/lib/hooks/use-workout-elapsed'
import { LiveDot } from '@/shared/ui/kit/LiveDot'

// Время в подписи шапки: без разрядки капса и с равной шириной цифр, иначе строка подрагивает каждую секунду.
// Отдельный компонент, чтобы ежесекундный тик перерисовывал только его, а не весь экран
export const ElapsedInline = ({ startedAt }: { startedAt: string }) => (
  <span className='text-foreground inline-flex items-center gap-1.5 align-middle tracking-normal tabular-nums'>
    <LiveDot />
    {useWorkoutElapsed(startedAt)}
  </span>
)
