import { pluralize } from '@front-cmdt/utils/pluralize'
import { ArrowRightIcon } from 'lucide-react'

import { toAssetUrl } from '@/shared/api'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import type { CooldownFlow } from '../model/use-cooldown-flow'
import { CooldownAdd } from './CooldownAdd'
import { CooldownDetailSheet } from './CooldownSheets'

// Развилка после основного блока и в самом конце: продолжить, добавить ещё или закончить (frontend-tz, 9.1)
export const CooldownMore = ({ flow }: { flow: CooldownFlow }) => {
  const { cooldown, done, remaining, remainingMinutes } = flow
  const hasMore = remaining.length > 0
  // Из списка можно перепрыгнуть вперёд: тогда «основной блок пройден» было бы неправдой
  const mainLeft = cooldown.main.some(s => !done.has(s.id))

  return (
    <Screen
      header={
        <TopBar
          back={flow.back}
          onBack={flow.leave}
          title='Заминка'
          subtitle={mainLeft ? 'есть пропущенные' : hasMore ? 'основной блок пройден' : 'все растяжки пройдены'}
        />
      }
      footer={
        <StickyFooter>
          <Button
            variant={hasMore ? 'outline' : 'default'}
            size='lg'
            onClick={flow.finish}
          >
            Завершить
          </Button>
          {hasMore && (
            <Button
              size='lg'
              onClick={flow.resume}
            >
              Продолжить
              <ArrowRightIcon
                className='size-7'
                strokeWidth={2.5}
              />
            </Button>
          )}
        </StickyFooter>
      }
      className='px-gutter'
    >
      <Rise>
        <Lead>{hasMore ? 'есть время ещё —' : 'заминка пройдена —'}</Lead>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          numeric
          className='mt-1'
        >
          {hasMore ? `на ~${remainingMinutes} мин?` : 'ещё?'}
        </Poster>
      </Rise>
      {hasMore && (
        <ScreenSection
          title='Дальше'
          aside={pluralize(remaining.length, ['растяжка', 'растяжки', 'растяжек'])}
        >
          <List>
            {remaining.map(s => (
              <CatalogRow
                key={s.id}
                name={s.name}
                imageUrl={toAssetUrl(s.imageUrl) ?? null}
                meta={`${s.muscles} · ${s.holdSeconds} с${s.perSide ? ' × 2' : ''}`}
                onClick={() => flow.open(s)}
              />
            ))}
          </List>
        </ScreenSection>
      )}
      <ScreenSection title='Добавить растяжку'>
        <CooldownAdd flow={flow} />
      </ScreenSection>
      <CooldownDetailSheet flow={flow} />
    </Screen>
  )
}
