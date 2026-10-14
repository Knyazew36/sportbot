import { useSearchParams } from 'react-router'

import { useAdminCounters } from '@/entities/admin'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'

import { CatalogTab } from './components/CatalogTab'
import { ComplaintsTab } from './components/ComplaintsTab'
import { ImportTab } from './components/ImportTab'
import { ModerationTab } from './components/ModerationTab'
import { TemplatesTab } from './components/TemplatesTab'
import { UsersTab } from './components/UsersTab'

type Tab = 'moderation' | 'complaints' | 'catalog' | 'templates' | 'users' | 'import'

const TAB_VALUES: Tab[] = ['moderation', 'complaints', 'catalog', 'templates', 'users', 'import']

// Админка (frontend-tz, 14): мобильная раскладка, таблицы — списками карточек. Видна только администратору
const AdminPage = () => {
  const [params, setParams] = useSearchParams()
  const tab = TAB_VALUES.find(t => t === params.get('tab')) ?? 'moderation'
  const counters = useAdminCounters()
  const count = (n: number | undefined) => (n ? ` · ${n}` : '')

  // Сначала то, что ждёт реакции: заявки и жалобы со счётчиками
  const tabs: { value: Tab; label: string }[] = [
    { value: 'moderation', label: `Модерация${count(counters.data?.requests)}` },
    { value: 'complaints', label: `Жалобы${count(counters.data?.complaints)}` },
    { value: 'catalog', label: 'Справочник' },
    { value: 'templates', label: 'Шаблоны' },
    { value: 'users', label: `Пользователи${count(counters.data?.users)}` },
    { value: 'import', label: 'Импорт' },
  ]

  return (
    <Screen
      key={tab}
      header={
        <>
          <ScreenHeader
            title='Админ'
            aside='только администратору'
          />
          <div className='no-scrollbar overflow-x-auto px-gutter pt-4 pb-1'>
            <Segmented
              options={tabs}
              value={tab}
              onValueChange={next => setParams({ tab: next }, { replace: true })}
            />
          </div>
        </>
      }
      className='gap-5 pt-5'
    >
      {tab === 'moderation' && <ModerationTab />}
      {tab === 'complaints' && <ComplaintsTab />}
      {tab === 'catalog' && <CatalogTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'import' && <ImportTab />}
    </Screen>
  )
}

export default AdminPage
