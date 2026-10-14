import { useNavigate, useParams } from 'react-router'

import { EntryErrorScreen as EntryError, type EntryErrorReason } from '@/pages/entry/EntryErrorScreen'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Eyebrow } from '@/shared/ui/kit/Typography'

const REASONS: { value: EntryErrorReason; label: string }[] = [
  { value: 'outside', label: 'Не из бота' },
  { value: 'blocked', label: 'Блокировка' },
  { value: 'offline', label: 'Нет связи' },
]

const EntryErrorScreen = () => {
  const { reason = 'outside' } = useParams()
  const navigate = useNavigate()
  const key = (REASONS.some(r => r.value === reason) ? reason : 'outside') as EntryErrorReason

  return (
    <>
      <EntryError
        key={key}
        reason={key}
        onRetry={() => undefined}
      />
      {/* Переключатель только для превью */}
      <Rise className='no-scrollbar flex items-center gap-2 overflow-x-auto px-gutter pb-4'>
        <Eyebrow className='shrink-0'>превью:</Eyebrow>
        <Segmented
          options={REASONS}
          value={key}
          onValueChange={next => navigate(buildPath(ROUTES.PREVIEW_ENTRY, { reason: next }), { replace: true })}
        />
      </Rise>
    </>
  )
}

export default EntryErrorScreen
