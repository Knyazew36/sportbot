import { useSearchParams } from 'react-router'

import { Screen } from '@/shared/ui/kit/Screen'
import { ScreenHeader } from '@/shared/ui/kit/ScreenHeader'
import { Segmented } from '@/shared/ui/kit/Segmented'

import { complaints, moderationQueue } from '../model/admin'

import { CatalogTab } from './tabs/CatalogTab'
import { ComplaintsTab } from './tabs/ComplaintsTab'
import { ImportTab } from './tabs/ImportTab'
import { ModerationTab } from './tabs/ModerationTab'
import { TemplatesTab } from './tabs/TemplatesTab'
import { UsersTab } from './tabs/UsersTab'

type Tab = 'moderation' | 'complaints' | 'catalog' | 'templates' | 'users' | 'import'

// Сначала то, что ждёт реакции: заявки и жалобы со счётчиками
const TABS: { value: Tab; label: string }[] = [
  { value: 'moderation', label: `Модерация · ${moderationQueue.length}` },
  { value: 'complaints', label: `Жалобы · ${complaints.length}` },
  { value: 'catalog', label: 'Справочник' },
  { value: 'templates', label: 'Шаблоны' },
  { value: 'users', label: 'Пользователи' },
  { value: 'import', label: 'Импорт' },
]

// Админка (frontend-tz, раздел 14): мобильная раскладка, таблицы — списками карточек
const AdminScreen = () => {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find(t => t.value === params.get('tab'))?.value ?? 'moderation') as Tab

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
              options={TABS}
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

export default AdminScreen
