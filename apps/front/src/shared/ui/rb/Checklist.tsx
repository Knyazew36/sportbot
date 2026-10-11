import { useState } from 'react'
import { cn } from '@/shared/lib/utils'
import { Checkbox } from '@/shared/ui/shadcn/animate-ui/components/radix/checkbox'

export type ChecklistItem = { id: string; label: string; done: boolean; required?: boolean }

// Локальное состояние: макет без API, но отметки должны реально переключаться для проверки клавиатурой
export const Checklist = ({ items, readOnly, className }: { items: ChecklistItem[]; readOnly?: boolean; className?: string }) => {
  const [state, setState] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.done])))
  const doneCount = Object.values(state).filter(Boolean).length

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${(doneCount / Math.max(items.length, 1)) * 100}%` }}
          />
        </div>
        <span className="mono-label text-smoke tabular-nums">
          {doneCount}/{items.length}
        </span>
      </div>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-mist',
                readOnly && 'pointer-events-none',
              )}
            >
              <Checkbox
                checked={state[item.id]}
                disabled={readOnly}
                onCheckedChange={(checked) => setState((prev) => ({ ...prev, [item.id]: checked === true }))}
              />
              <span className={cn('flex-1 text-body-sm', state[item.id] && 'text-smoke line-through')}>{item.label}</span>
              {item.required && <span className="mono-label text-smoke">обязательно</span>}
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
