import { APP_NAME } from '@/shared/config/app'

type LayoutAuthProps = {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  /** Ссылки под формой: «Нет аккаунта?», «Забыли пароль?» */
  footer?: React.ReactNode
}

// Общая рамка страниц входа: название продукта, заголовок шага, карточка формы
export const LayoutAuth = ({ title, description, children, footer }: LayoutAuthProps) => (
  <main className='bg-canvas flex min-h-svh flex-col items-center justify-center gap-8 p-4'>
    <span className='section-heading text-subheading-lg font-medium'>{APP_NAME}</span>
    <div className='rounded-card bg-card flex w-full max-w-md flex-col gap-6 p-6 md:p-8'>
      <header className='flex flex-col gap-2'>
        <h1 className='section-heading text-heading-sm'>{title}</h1>
        {description && <p className='text-body-sm text-slate'>{description}</p>}
      </header>
      {children}
    </div>
    {footer && <div className='text-body-sm text-slate flex flex-col items-center gap-2'>{footer}</div>}
  </main>
)

// Текст ссылки под формой; сама навигация — снаружи, в <Link>
export const AuthLink = (props: React.ComponentProps<'span'>) => (
  <span
    className='text-foreground font-medium underline-offset-4 hover:underline'
    {...props}
  />
)
