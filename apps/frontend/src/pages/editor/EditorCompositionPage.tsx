import { COMPOSITIONS, isCompositionId } from '@sportbot/render-contract'
import { FolderOpenIcon } from 'lucide-react'
import { Navigate, useParams } from 'react-router'

import { ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { Text } from '@/shared/ui/kit/Typography'

import { EDITORS } from './editors'

// Форма одного ролика. Файл можно не ждать на экране: он делается на сервере и ждёт в «Моих файлах»
const EditorCompositionPage = () => {
  const id = useParams().compositionId

  // Старая или выдуманная ссылка — в хаб, а не на 404
  if (!id || !isCompositionId(id))
    return (
      <Navigate
        to={ROUTES.ME_EDITOR}
        replace
      />
    )

  const Editor = EDITORS[id].component

  return (
    <Screen
      header={
        <TopBar
          back={ROUTES.ME_EDITOR}
          title={COMPOSITIONS[id].title}
        />
      }
      className='gap-8'
    >
      <Rise className='px-gutter'>
        <Editor />
      </Rise>
      <Rise className='px-gutter flex flex-col gap-3'>
        <Text
          size='sm'
          tone='muted'
        >
          Файл можно не ждать: закрой экран — он доделается и пролежит сутки в «Моих файлах».
        </Text>
        <ButtonLink
          to={ROUTES.ME_EDITOR_FILES}
          variant='outline'
          size='sm'
          className='self-start'
        >
          <FolderOpenIcon />
          Мои файлы
        </ButtonLink>
      </Rise>
    </Screen>
  )
}

export default EditorCompositionPage
