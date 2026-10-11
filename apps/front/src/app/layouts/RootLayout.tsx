import { Outlet } from 'react-router'
import { env } from '@/env'
import { DemoSwitcher } from '@/widgets/demo-switcher/DemoSwitcher'

// Обёртка без своего <main>: у кабинета и гостевых страниц собственная разметка оболочки
const RootLayout = () => (
  <>
    <Outlet />
    {env.DEMO && <DemoSwitcher />}
  </>
)

export default RootLayout
