import { COMPOSITION_IDS } from '@sportbot/render-contract'
import { ChevronRightIcon, FolderOpenIcon } from 'lucide-react'
import { Link } from 'react-router'

import { useRenderJobs } from '@sportbot/api/entities/render'
import { ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'

import { CompositionCard } from './components/CompositionCard'
import { filesSummary, visibleFiles } from './lib'

// Редактор: сверху — свои файлы (за ними сюда возвращаются чаще всего), ниже — ролики карточками.
// Ролики берутся из контракта: новая композиция появится здесь сама
const EditorPage = () => {
  const jobs = useRenderJobs()

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME}
          title='Редактор'
        />
      }
      className='gap-10'
    >
      <Rise className='px-gutter'>
        <Link
          to={ROUTES.ME_EDITOR_FILES}
          className='border-foreground bg-card hover:border-primary flex items-center gap-3 border-[1.5px] p-3 transition-[border-color,box-shadow] hover:shadow-[3px_3px_0_var(--sb-blue)]'
        >
          <FolderOpenIcon className='size-6 shrink-0' />
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <Poster
              as='h2'
              size='sm'
            >
              Мои файлы
            </Poster>
            <Text
              size='sm'
              tone='muted'
            >
              {jobs.isPending ? 'загружаем…' : `${filesSummary(visibleFiles(jobs.data))} · лежат сутки`}
            </Text>
          </div>
          <ChevronRightIcon className='text-foreground/40 size-5 shrink-0' />
        </Link>
      </Rise>

      <ScreenSection
        title='Плашки'
        aside='для своих видео'
      >
        <ul className='flex flex-col gap-3'>
          {COMPOSITION_IDS.map(id => (
            <CompositionCard
              key={id}
              id={id}
            />
          ))}
        </ul>
      </ScreenSection>
    </Screen>
  )
}

export default EditorPage
