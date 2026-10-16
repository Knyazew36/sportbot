import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'

import { SERVICES } from '../developer'

export const ServicesList = () => (
  <ScreenSection title='Что можем сделать'>
    <List>
      {SERVICES.map(({ title, text }, i) => (
        <ListRow
          key={title}
          lead={String(i + 1).padStart(2, '0')}
          title={title}
          meta={text}
        />
      ))}
    </List>
  </ScreenSection>
)
