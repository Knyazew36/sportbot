import { cn } from '@/shared/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar'

type PersonAvatarProps = {
  name: string
  src?: string
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl'
  // inverse — для карточек на чёрном; accent — выделить текущего пользователя mint-кружком
  tone?: 'default' | 'inverse' | 'accent'
  className?: string
}

const SIZE: Record<NonNullable<PersonAvatarProps['size']>, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-caption',
  default: 'size-10 text-body-sm',
  lg: 'size-12 text-body',
  xl: 'size-20 text-heading-sm',
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

// Без фото — инициалы на монохромной подложке: цветом людей не различаем, акцент только у «я»
export const PersonAvatar = ({ name, src, size = 'default', tone = 'default', className }: PersonAvatarProps) => (
  <Avatar className={cn(SIZE[size], className)}>
    {src && <AvatarImage src={src} alt={name} />}
    <AvatarFallback
      className={cn(
        'font-medium tracking-tight',
        tone === 'default' && 'bg-mist text-foreground',
        tone === 'inverse' && 'bg-background/15 text-background',
        tone === 'accent' && 'bg-success text-black',
      )}
    >
      {initials(name)}
    </AvatarFallback>
  </Avatar>
)

// Человек с ролью/подписью рядом — исполнитель, проверяющий, ответственный
export const PersonLine = ({
  name,
  caption,
  size = 'sm',
  className,
}: {
  name: string
  caption?: React.ReactNode
  size?: PersonAvatarProps['size']
  className?: string
}) => (
  <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
    <PersonAvatar name={name} size={size} />
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-body-sm font-medium">{name}</span>
      {caption && <span className="mono-label truncate text-smoke">{caption}</span>}
    </span>
  </span>
)
