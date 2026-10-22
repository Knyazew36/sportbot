import type { ReactNode } from 'react'

import { FinishArt, PodiumArt, RestArt, TrainingArt } from '@/shared/ui/kit/Art'
import { Lead, Poster } from '@/shared/ui/kit/Typography'

import { BodyMapCardDemo, LibraryFiltersDemo } from './components/LibraryFiltersDemo'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className='grid gap-3'>
    <Lead size='md'>{title}</Lead>
    {children}
  </section>
)

// Витрина иллюстраций: сцены гири по состояниям дня — смотреть и выбирать без нужного состояния на «Сегодня»
const UiPage = () => (
  <main className='bg-background text-foreground px-gutter mx-auto grid min-h-dvh max-w-md gap-10 py-8'>
    <Poster
      as='h1'
      size='3xl'
      tone='primary'
    >
      Иллюстрации
    </Poster>
    <Section title='Справочник — фильтры в шторках'>
      <LibraryFiltersDemo />
    </Section>
    <Section title='Карта тела в карточке упражнения'>
      <BodyMapCardDemo />
    </Section>
    <Section title='Отдых'>
      <RestArt />
    </Section>
    <Section title='День тренировки'>
      <TrainingArt />
    </Section>
    <Section title='Итог тренировки'>
      <FinishArt />
    </Section>
    <Section title='Засчитано'>
      <PodiumArt />
    </Section>
  </main>
)

export default UiPage
