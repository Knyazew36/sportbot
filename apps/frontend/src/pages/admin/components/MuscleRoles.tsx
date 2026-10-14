import type { CatalogRef } from '@/entities/catalog'
import { cn } from '@/shared/lib/utils'
import { Eyebrow } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

type MuscleRolesProps = {
  muscles: CatalogRef[]
  primary: number[]
  secondary: number[]
  onChange: (next: { primary: number[]; secondary: number[] }) => void
}

// Роль мышцы одним нажатием по кругу: нет → основная → вспомогательная → нет.
// Два отдельных списка по 16 мышц заняли бы два экрана
export const MuscleRoles = ({ muscles, primary, secondary, onChange }: MuscleRolesProps) => {
  const cycle = (id: number) => {
    if (primary.includes(id))
      onChange({ primary: primary.filter(x => x !== id), secondary: [...secondary, id] })
    else if (secondary.includes(id)) onChange({ primary, secondary: secondary.filter(x => x !== id) })
    else onChange({ primary: [...primary, id], secondary })
  }

  return (
    <div className='grid grid-cols-2 gap-2'>
      {muscles.map(m => {
        const role = primary.includes(m.id) ? 'PRIMARY' : secondary.includes(m.id) ? 'SECONDARY' : null
        return (
          <Button
            key={m.id}
            type='button'
            variant={role === 'PRIMARY' ? 'default' : role === 'SECONDARY' ? 'alert' : 'outline'}
            size='sm'
            onClick={() => cycle(m.id)}
            aria-label={`${m.name}: ${role === 'PRIMARY' ? 'основная' : role === 'SECONDARY' ? 'вспомогательная' : 'не участвует'}`}
            className={cn('h-11 justify-between px-3', !role && 'text-foreground/60')}
          >
            <span className='truncate'>{m.name}</span>
            {role && (
              <Eyebrow
                size='sm'
                tone='inherit'
              >
                {role === 'PRIMARY' ? 'осн' : 'всп'}
              </Eyebrow>
            )}
          </Button>
        )
      })}
    </div>
  )
}
