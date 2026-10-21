import { useDeleteStretchExclusion, useStretchExclusions } from '@/entities/stretch-exclusion'
import { toAssetUrl } from '@/shared/api'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { List } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

// Растяжки, убранные кнопкой «Не предлагать» в заминке или справочнике: тут их возвращают
export const ExcludedStretchesSection = () => {
  const exclusions = useStretchExclusions()
  const restore = useDeleteStretchExclusion()

  return (
    <ScreenSection aside='не попадут в заминку'>
      {exclusions.data?.length ? (
        <List>
          {exclusions.data.map(e => (
            <CatalogRow
              key={e.stretchId}
              name={e.name}
              imageUrl={toAssetUrl(e.imageUrl) ?? null}
              meta={e.muscles}
              to={buildPath(ROUTES.STRETCH, { stretchId: e.stretchId })}
              trail={
                <Button
                  variant='outline'
                  size='xs'
                  disabled={restore.isPending}
                  onClick={() => restore.mutate(e.stretchId)}
                >
                  Вернуть
                </Button>
              }
            />
          ))}
        </List>
      ) : (
        <Text tone='muted'>Исключённых нет. Если растяжка не подходит, нажми «Не предлагать» в заминке.</Text>
      )}
    </ScreenSection>
  )
}
