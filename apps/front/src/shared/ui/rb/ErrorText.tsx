import { CircleAlertIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

type ErrorLike = { message?: string } | string | null | undefined

type ErrorTextProps = {
  // Либо готовый текст в children, либо ошибки из react-hook-form / API — дубли схлопываются
  children?: React.ReactNode
  errors?: ErrorLike | ErrorLike[]
  id?: string
  className?: string
}

const toMessages = (errors: ErrorTextProps['errors']) => {
  const list = Array.isArray(errors) ? errors : [errors]
  const messages = list.map((error) => (typeof error === 'string' ? error : error?.message)).filter(Boolean) as string[]
  return [...new Set(messages)]
}

// Единственный компонент текста ошибки: поле формы, форма целиком, ошибка действия.
// Иконка обязательна — ошибка не передаётся одним красным цветом (§9)
export const ErrorText = ({ children, errors, id, className }: ErrorTextProps) => {
  const messages = children ? [] : toMessages(errors)
  if (!children && messages.length === 0) return null

  return (
    <div role="alert" id={id} data-slot="error-text" className={cn('flex items-start gap-1.5 text-body-sm text-destructive', className)}>
      <CircleAlertIcon className="mt-px size-4 shrink-0" aria-hidden />
      {children ? (
        <span>{children}</span>
      ) : messages.length === 1 ? (
        <span>{messages[0]}</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
