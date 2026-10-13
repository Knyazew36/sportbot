import { Outlet } from 'react-router'

import { type AppAction, type AppSubject, useAbility } from '@/entities/session'
import { StateView } from '@/shared/ui/kit/StateView'

// Страница кабинета по праву роли: без права вместо неё заглушка, запросы страницы не уходят
const RequireAbility = ({ I, a }: { I: AppAction; a: AppSubject }) =>
  useAbility().can(I, a) ? <Outlet /> : <StateView state='denied' />

export default RequireAbility
