import { type CatalogKind, useSimilar } from '@/entities/catalog'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { useDebouncedValue } from '@/shared/lib/hooks/use-debounced-value'
import { List } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'

import { CatalogRow } from './CatalogRow'

// «Возможно, ты искал…»: похожие записи справочника, чтобы не плодить дубли (business-tz, 5.5)
// onPick — мастер открыт из замены: похожее из справочника сразу ставим на замену, а не открываем карточку
export const SimilarEntries = ({
  kind,
  name,
  onPick,
  hint = 'Не то? Жми «Дальше» — создадим своё.',
}: {
  kind: CatalogKind
  name: string
  onPick?: (entry: { id: number; name: string }) => void
  /** Что делать, если похожее не подошло */
  hint?: string
}) => {
  const similar = useSimilar(kind, useDebouncedValue(name.trim(), 400))
  if (!similar.data?.length) return null
  return (
    <ScreenSection
      title='Возможно, ты искал…'
      aside='уже есть в справочнике'
    >
      <List>
        {similar.data.map(m => (
          <CatalogRow
            key={m.id}
            name={m.name}
            imageUrl={null}
            meta={kind === 'exercise' ? 'упражнение справочника' : 'растяжка справочника'}
            onClick={onPick && (() => onPick({ id: m.id, name: m.name }))}
            to={
              onPick
                ? undefined
                : kind === 'exercise'
                  ? buildPath(ROUTES.EXERCISE, { exerciseId: m.id })
                  : buildPath(ROUTES.STRETCH, { stretchId: m.id })
            }
          />
        ))}
      </List>
      <Text
        size='xs'
        tone='muted'
      >
        {hint}
      </Text>
    </ScreenSection>
  )
}
