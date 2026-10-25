import type { ReactNode } from 'react'

import type { Guide } from '@sportbot/api/entities/catalog/lib'
import { MistakeList } from '@/shared/ui/kit/MistakeList'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StepList } from '@/shared/ui/kit/StepList'
import { Text } from '@/shared/ui/kit/Typography'

type CatalogGuideProps = {
  guide: Guide
  /** Заголовок блока шагов: «Техника» у упражнения, «Как делать» у растяжки */
  title: string
  /** Пояснение под шагами */
  note?: ReactNode
}

// Инструкция из справочника: описание, шаги и типичные ошибки. Пустые блоки не показываются
export const CatalogGuide = ({ guide, title, note }: CatalogGuideProps) => (
  <>
    {(guide.description || guide.steps.length > 0) && (
      <ScreenSection title={title}>
        {guide.description && <Text className='leading-relaxed'>{guide.description}</Text>}
        {guide.steps.length > 0 && <StepList items={guide.steps} />}
        {note}
      </ScreenSection>
    )}
    {guide.mistakes.length > 0 && (
      <ScreenSection title='Типичные ошибки'>
        <MistakeList items={guide.mistakes} />
      </ScreenSection>
    )}
  </>
)
