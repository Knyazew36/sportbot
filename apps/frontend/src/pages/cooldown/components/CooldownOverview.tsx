import { pluralize } from '@front-cmdt/utils/pluralize'
import { ArrowRightIcon } from 'lucide-react'

import { toAssetUrl } from '@/shared/api'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { List } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Lead, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { CatalogRow } from '@/widgets/catalog/CatalogRow'

import type { CooldownFlow } from '../model/use-cooldown-flow'
import { CooldownDetailSheet } from './CooldownSheets'

// Обзор перед стартом: сколько минут и какие растяжки в основном блоке и «если есть время»
export const CooldownOverview = ({ flow }: { flow: CooldownFlow }) => {
  const { cooldown, back } = flow
  const blocks = [
    { title: 'Основной блок', list: cooldown.main },
    { title: 'Если есть время', list: cooldown.optional },
  ].filter(b => b.list.length)

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title='Заминка'
          subtitle={`~${cooldown.minutes} мин`}
        />
      }
      footer={
        <StickyFooter>
          <ButtonLink
            to={back}
            variant='outline'
            size='lg'
          >
            Пропустить
          </ButtonLink>
          <Button
            size='lg'
            onClick={() => flow.go(0)}
          >
            Начать
            <ArrowRightIcon
              className='size-7'
              strokeWidth={2.5}
            />
          </Button>
        </StickyFooter>
      }
      className='px-gutter'
    >
      <Rise>
        <Lead>растяжка на отработавшие мышцы —</Lead>
        <Poster
          as='h1'
          size='display'
          tone='primary'
          numeric
        >
          ~{cooldown.minutes} мин
        </Poster>
      </Rise>
      {blocks.map(block => (
        <ScreenSection
          key={block.title}
          title={block.title}
          aside={pluralize(block.list.length, ['растяжка', 'растяжки', 'растяжек'])}
        >
          <List>
            {block.list.map(s => (
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
      ))}
      <CooldownDetailSheet flow={flow} />
    </Screen>
  )
}
