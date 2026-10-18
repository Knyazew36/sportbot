import { useRenderJobs } from '@/entities/render'
import { ROUTES } from '@/shared/config/paths'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'

import { RenderFileList } from './components/RenderFileList'
import { visibleFiles } from './lib'

// Свои файлы всех роликов за сутки: заказал, закрыл и ушёл — готовый файл ждёт здесь.
// Список опрашивается, пока что-то в работе: «Готовим…» сам сменится на «Скачать»
const EditorFilesPage = () => {
  const jobs = useRenderJobs()

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME_EDITOR}
          title='Мои файлы'
          subtitle='лежат сутки, потом удаляются'
        />
      }
    >
      <QueryScreen
        query={jobs}
        isEmpty={data => visibleFiles(data).length === 0}
        empty={{
          title: 'Пока пусто',
          description: 'Сделай плашку в редакторе или на карточке упражнения — файл появится здесь.',
        }}
      >
        {data => (
          <Rise className='px-gutter'>
            <RenderFileList files={visibleFiles(data)} />
          </Rise>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default EditorFilesPage
