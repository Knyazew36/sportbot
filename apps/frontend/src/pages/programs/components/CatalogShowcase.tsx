import { ArrowRightIcon, ArrowUpRightIcon, UploadIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { ReactNode } from 'react'

import { addedText, catalogItemPath, catalogSourceOf, type CatalogData, type Program } from '@/entities/program'
import { ROUTES } from '@/shared/config/paths'
import { InkPanel } from '@/shared/ui/kit/InkPanel'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { TemplateCard } from './TemplateCard'
import { TemplateTile } from './TemplateTile'

/** Мест в рейтинге */
const CHART = 5
/** Меньше — это не рейтинг, а пара случайных добавлений: плашку не показываем */
const CHART_MIN = 3
/** Программ в ленте «От сообщества»: дальше — весь список пользователей фильтром */
const COMMUNITY = 10

type CatalogShowcaseProps = {
  data: CatalogData
  /** «Все» у ленты сообщества: включить фильтр «от пользователей» */
  onShowCommunity: () => void
  /** «Весь рейтинг» под плашкой популярного: включить сортировку по популярности */
  onShowPopular: () => void
}

// Витрина без фильтров — как стенд с афишами: рейтинг того, что берут чаще, лента программ пользователей
// (их видно сразу, а не за табом) и весь каталог билетами. Лента сообщества кончается приглашением
// опубликовать свою: так каталог растёт
export const CatalogShowcase = ({ data, onShowCommunity, onShowPopular }: CatalogShowcaseProps) => {
  const all = [...data.templates, ...data.users]
  const chart = byPopularity(all.filter(t => t.addedCount > 0)).slice(0, CHART)

  return (
    <>
      {chart.length >= CHART_MIN && (
        <PopularChart
          list={chart}
          onShowAll={onShowPopular}
        />
      )}

      <Rise className='flex flex-col gap-3'>
        <SectionHeading
          title='От сообщества'
          aside='собрали другие — бери и правь под себя'
          action={
            data.users.length > COMMUNITY && (
              <Button
                variant='link'
                size='sm'
                className='h-auto shrink-0 p-0'
                onClick={onShowCommunity}
              >
                Все
                <ArrowRightIcon />
              </Button>
            )
          }
        />
        <ul className='no-scrollbar px-gutter flex gap-2 overflow-x-auto pb-1'>
          {data.users.slice(0, COMMUNITY).map(t => (
            <TemplateTile
              key={t.id}
              template={t}
            />
          ))}
          <li className='w-60 shrink-0'>
            <Link
              to={ROUTES.PROGRAMS}
              className='border-primary/60 bg-accent/40 hover:bg-accent flex h-full min-h-40 flex-col justify-between gap-3 border-[1.5px] border-dashed p-3 transition-colors'
            >
              <UploadIcon className='text-primary size-6' />
              <Poster
                as='p'
                size='sm'
              >
                Собрал свою? Покажи другим
              </Poster>
              <Text
                size='sm'
                tone='muted'
              >
                В редакторе программы — блок «Каталог».
              </Text>
              <Eyebrow tone='primary'>к моим программам →</Eyebrow>
            </Link>
          </li>
        </ul>
      </Rise>

      <Rise className='flex flex-col gap-3'>
        <SectionHeading
          title='Все программы'
          aside={`${all.length} в каталоге`}
        />
        <div className='px-gutter flex flex-col gap-5'>
          {all.map(t => (
            <TemplateCard
              key={t.id}
              template={t}
            />
          ))}
        </div>
      </Rise>
    </>
  )
}

/** Сначала то, что чаще берут; при равенстве — порядок каталога (sort стабильный) */
export const byPopularity = (list: Program[]): Program[] => [...list].sort((a, b) => b.addedCount - a.addedCount)

// Рейтинг — главный акцент витрины: чёрная плашка с дорожками, места крупными цифрами. Социальное доказательство
// раньше фильтров: новичку проще начать с того, что уже взяли другие
const PopularChart = ({ list, onShowAll }: { list: Program[]; onShowAll: () => void }) => (
  <Rise className='px-gutter'>
    <InkPanel className='mr-1.5 mb-1.5 shadow-[6px_6px_0_var(--sb-blue)]'>
      <div className='flex items-end justify-between gap-3 px-4 pt-4 pb-2'>
        <div className='flex flex-col gap-1'>
          <Eyebrow tone='inverseMuted'>популярное</Eyebrow>
          <Poster
            as='h2'
            size='xl'
            tone='inverse'
          >
            Берут чаще всего
          </Poster>
        </div>
      </div>
      <ol>
        {list.map((t, i) => (
          <li
            key={t.id}
            className='border-background/15 border-t first:border-t-0'
          >
            <Link
              to={catalogItemPath(t.id, catalogSourceOf(t))}
              className='hover:bg-background/5 flex items-center gap-3 px-4 py-2.5 transition-colors'
            >
              <Poster
                as='span'
                size='2xl'
                numeric
                tone={i === 0 ? 'primary' : 'inverseMuted'}
                className='w-8 shrink-0 text-center'
              >
                {i + 1}
              </Poster>
              <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <Poster
                  as='span'
                  size='sm'
                  tone='inverse'
                  className='truncate'
                >
                  {t.name}
                </Poster>
                <Eyebrow tone='inverseMuted'>
                  {addedText(t.addedCount)}
                  {t.author && ` · ${t.author.name}`}
                </Eyebrow>
              </div>
              <ArrowUpRightIcon className='text-background/50 size-5 shrink-0' />
            </Link>
          </li>
        ))}
      </ol>
      <button
        type='button'
        onClick={onShowAll}
        className='border-background/15 text-background/80 hover:text-background flex w-full items-center justify-between border-t px-4 py-3 text-left'
      >
        <Eyebrow tone='inherit'>весь рейтинг</Eyebrow>
        <ArrowRightIcon className='size-4' />
      </button>
    </InkPanel>
  </Rise>
)

// Заголовок блока витрины: плакатом, пояснение строкой ниже — блоки разные по виду, но читаются как разделы афиши
const SectionHeading = ({ title, aside, action }: { title: string; aside?: string; action?: ReactNode }) => (
  <div className='px-gutter flex items-end justify-between gap-3'>
    <div className='flex min-w-0 flex-col gap-1'>
      <Poster
        as='h2'
        size='lg'
      >
        {title}
      </Poster>
      {aside && (
        <Text
          size='sm'
          tone='muted'
        >
          {aside}
        </Text>
      )}
    </div>
    {action}
  </div>
)
