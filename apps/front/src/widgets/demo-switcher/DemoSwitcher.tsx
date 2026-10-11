import { useEffect, useState } from 'react'
import { FlaskConicalIcon, XIcon } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { DEMO_OBJECTS, DEMO_ROLES, DEMO_STATES, useDemoState, useDemoStore } from '@/shared/mock/state'

const Group = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) => (
  <fieldset className="flex flex-col gap-1.5">
    <legend className="mb-1.5 text-smoke">{label}</legend>
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'rounded-full px-2.5 py-1 transition-colors',
            value === option.value ? 'bg-background text-foreground' : 'text-background/70 hover:bg-background/15 hover:text-background',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
)

// Панель вариантов макета: роль, число объектов, состояние экрана. Пишет в URL — вариант можно переслать ссылкой
export const DemoSwitcher = () => {
  const [open, setOpen] = useState(false)
  const [, setParams] = useSearchParams()
  const demo = useDemoState()
  const store = useDemoStore()

  // Роль и объекты из ссылки запоминаются: переход по меню не должен сбрасывать вариант
  useEffect(() => {
    if (demo.role !== store.role) store.setRole(demo.role)
    if (demo.objects !== store.objects) store.setObjects(demo.objects)
  }, [demo.role, demo.objects, store])

  const set = (key: string, value: string, fallback: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === fallback && key === 'state') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )

  return (
    <div className="mono-label fixed right-4 bottom-24 z-40 md:bottom-4">
      {open ? (
        <div className="flex w-72 flex-col gap-4 rounded-3xl bg-foreground p-4 text-background">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FlaskConicalIcon className="size-3.5" aria-hidden /> Вариант макета
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-full hover:bg-background/15"
              aria-label="Скрыть панель"
            >
              <XIcon className="size-3.5" aria-hidden />
            </button>
          </div>
          <Group label="Роль" options={DEMO_ROLES} value={demo.role} onChange={(v) => set('role', v, 'owner')} />
          <Group label="Объекты" options={DEMO_OBJECTS} value={demo.objects} onChange={(v) => set('objects', v, 'many')} />
          <Group label="Состояние экрана" options={DEMO_STATES} value={demo.state} onChange={(v) => set('state', v, 'ok')} />
          <Link to={ROUTES.PAGES} className="text-background/70 underline-offset-4 hover:text-background hover:underline">
            → Все экраны
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full bg-foreground px-4 text-background transition-transform hover:-translate-y-0.5"
        >
          <FlaskConicalIcon className="size-3.5" aria-hidden />
          {DEMO_ROLES.find((r) => r.value === demo.role)?.label} · {demo.state}
        </button>
      )}
    </div>
  )
}
