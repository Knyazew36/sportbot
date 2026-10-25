import { useSearchParams } from 'react-router'

import { useAdminCounters } from '@sportbot/api/entities/admin'
import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'

import { CatalogTab } from './components/CatalogTab'
import { ComplaintsTab } from './components/ComplaintsTab'
import { ImportTab } from './components/ImportTab'
import { ModerationTab } from './components/ModerationTab'
import { OverviewTab } from './components/OverviewTab'
import { ProgramReviewsTab } from './components/ProgramReviewsTab'
import { TemplatesTab } from './components/TemplatesTab'
import { UsersTab } from './components/UsersTab'

type Tab = 'overview' | 'moderation' | 'complaints' | 'programs' | 'catalog' | 'templates' | 'users' | 'import'

const TAB_VALUES: Tab[] = ['overview', 'moderation', 'complaints', 'programs', 'catalog', 'templates', 'users', 'import']

// Админка (frontend-tz, 14): мобильная раскладка, таблицы — списками карточек. Видна только администратору
const AdminPage = () => {
  const [params, setParams] = useSearchParams()
  const tab = TAB_VALUES.find(t => t === params.get('tab')) ?? 'overview'
  const counters = useAdminCounters()
  const count = (n: number | undefined) => (n ? ` · ${n}` : '')

  // Сначала общая картина, за ней то, что ждёт реакции: заявки, жалобы и программы пользователей со счётчиками
  const tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Обзор' },
    { value: 'moderation', label: `Модерация${count(counters.data?.requests)}` },
    { value: 'complaints', label: `Жалобы${count(counters.data?.complaints)}` },
    { value: 'programs', label: `Публикации${count(counters.data?.programReviews)}` },
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
          <div className='no-scrollbar px-gutter overflow-x-auto pt-4 pb-1'>
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
      {tab === 'overview' && <OverviewTab />}
      {tab === 'moderation' && <ModerationTab />}
      {tab === 'complaints' && <ComplaintsTab />}
      {tab === 'programs' && <ProgramReviewsTab />}
      {tab === 'catalog' && <CatalogTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'import' && <ImportTab />}
    </Screen>
  )
}

export default AdminPage
