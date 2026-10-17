import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Lead, Poster, type PosterSize, Text, type Tone, Unit } from '@/shared/ui/kit/Typography'

const POSTER: { size: PosterSize; px: string; use: string }[] = [
  { size: 'hero', px: '132 · 29.5vw', use: 'слово-плакат экрана' },
  { size: 'display', px: '104 · 24vw', use: 'плакат второго плана, шаг мастера' },
  { size: '5xl', px: '88 · 20vw', use: 'главная цифра: серия, время' },
  { size: '4xl', px: '72 · 16vw', use: 'имя, цифра рядом с главной' },
  { size: '3xl', px: '56 · 13vw', use: 'название программы' },
  { size: '2xl', px: '44 · 11vw', use: 'название упражнения, записи' },
  { size: 'xl', px: '34', use: 'цифра показателя, буква комплекса' },
  { size: 'lg', px: '28', use: 'заголовок шторки и карточки' },
  { size: 'md', px: '24', use: 'заголовок блока, значение строки' },
  { size: 'sm', px: '20', use: 'шапка экрана, название в кнопке' },
  { size: 'xs', px: '16', use: 'номер, мелкое значение' },
]

const TONES: Tone[] = ['default', 'primary', 'soft', 'muted', 'faint', 'danger']

const Row = ({ token, note, children }: { token: string; note: string; children: React.ReactNode }) => (
  <div className='border-border border-b-[1.5px] py-3'>
    <div className='mb-1.5 flex items-baseline justify-between gap-3'>
      <code className='text-primary font-mono text-[11px]'>{token}</code>
      <span className='text-muted-foreground text-right font-mono text-[11px]'>{note}</span>
    </div>
    {children}
  </div>
)

// Образцы типографики: вся шкала, цвета и типовые сочетания. Проверочные буквы «ЁЙЩЦу» показывают,
// что строка не срезает верх и низ
export const TypographySpecimen = () => (
  <>
    <ScreenSection
      title='01 · Poster'
      aside='Oswald 700 · заголовки и цифры'
    >
      <div className='border-border border-t-[1.5px]'>
        {POSTER.map(p => (
          <Row
            key={p.size}
            token={`size='${p.size}'`}
            note={`${p.px} · ${p.use}`}
          >
            <Poster size={p.size}>Ёлка 12</Poster>
          </Row>
        ))}
      </div>
    </ScreenSection>

    <ScreenSection
      title='Poster · режимы'
      aside='numeric · truncate · fit'
    >
      <div className='border-border border-t-[1.5px]'>
        <Row
          token='numeric'
          note='плотный интервал, равная ширина цифр'
        >
          <Poster
            size='5xl'
            numeric
          >
            01:07
          </Poster>
        </Row>
        <Row
          token='numeric + Unit'
          note='единица гротеском'
        >
          <Poster
            size='3xl'
            numeric
          >
            62,5<Unit>кг</Unit>
          </Poster>
        </Row>
        <Row
          token='truncate'
          note='одна строка, Ё Й Щ Ц не срезаны'
        >
          <Poster
            size='sm'
            truncate
          >
            Жим штанги лёжа узкий Щёлкай Цепью
          </Poster>
        </Row>
        <Row
          token='без truncate'
          note='перенос, строки не слипаются'
        >
          <Poster size='sm'>Жим гантелей на наклонной скамье лёжа</Poster>
        </Row>
        <Row
          token='fit'
          note='длинное слово ужимается под ширину'
        >
          <Poster
            size='hero'
            tone='primary'
            fit
          >
            Грудь
          </Poster>
          <Poster
            size='hero'
            tone='primary'
            fit
          >
            Широчайшие
          </Poster>
        </Row>
      </div>
    </ScreenSection>

    <ScreenSection
      title='02 · Lead'
      aside='Cormorant 300 italic · вводная строка'
    >
      <div className='border-border border-t-[1.5px]'>
        {(['xl', 'lg', 'md', 'sm'] as const).map(size => (
          <Row
            key={size}
            token={`size='${size}'`}
            note={{ xl: '40 · 10vw', lg: '34 · 8.5vw', md: '26', sm: '22' }[size]}
          >
            <Lead size={size}>сегодня на очереди —</Lead>
          </Row>
        ))}
      </div>
    </ScreenSection>

    <ScreenSection
      title='03 · Eyebrow'
      aside='Onest 400 · капс, разрядка 0.14em'
    >
      <div className='border-border border-t-[1.5px]'>
        <Row
          token="size='md'"
          note='11 · заголовок секции, подпись над значением'
        >
          <Eyebrow tone='primary'>Прогресс весов</Eyebrow>
        </Row>
        <Row
          token="size='sm'"
          note='10.5 · в тесных рамках'
        >
          <Eyebrow size='sm'>вес, кг</Eyebrow>
        </Row>
      </div>
    </ScreenSection>

    <ScreenSection
      title='04 · Text'
      aside='Onest 350 · основной текст'
    >
      <div className='border-border border-t-[1.5px]'>
        {(
          [
            ['lg', '16 · название строки списка'],
            ['md', '15 · абзацы и пояснения'],
            ['sm', '14 · вторичные строки'],
            ['xs', '13 · мета, подсказки под полем'],
            ['2xs', '12 · легенды, единицы'],
          ] as const
        ).map(([size, note]) => (
          <Row
            key={size}
            token={`size='${size}'`}
            note={note}
          >
            <Text size={size}>Лопатки сведены и прижаты к скамье, стопы упираются в пол.</Text>
          </Row>
        ))}
      </div>
    </ScreenSection>

    <ScreenSection
      title='05 · Тона'
      aside='один набор на все голоса'
    >
      <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
        {TONES.map(tone => (
          <div key={tone}>
            <code className='text-muted-foreground font-mono text-[11px]'>tone='{tone}'</code>
            <Poster
              size='md'
              tone={tone}
            >
              Грудь 12
            </Poster>
            <Text
              size='sm'
              tone={tone}
            >
              текст абзаца
            </Text>
          </div>
        ))}
      </div>
      <div className='bg-foreground grid grid-cols-2 gap-4 p-4'>
        {(['inverse', 'inverseMuted'] as const).map(tone => (
          <div key={tone}>
            <code className='text-background/60 font-mono text-[11px]'>tone='{tone}'</code>
            <Poster
              size='md'
              tone={tone}
            >
              01:07
            </Poster>
          </div>
        ))}
      </div>
    </ScreenSection>

    <ScreenSection
      title='06 · Сочетания'
      aside='как голоса работают вместе'
    >
      <div className='border-border flex flex-col gap-6 border-t-[1.5px] pt-4'>
        <div>
          <Lead>сегодня на очереди —</Lead>
          <Poster
            as='h1'
            size='hero'
            tone='primary'
            fit
            className='mt-1'
          >
            Грудь
          </Poster>
          <Poster
            size='3xl'
            className='mt-2'
          >
            и трицепс
          </Poster>
        </div>
        <div>
          <Eyebrow>Серия сейчас</Eyebrow>
          <Poster
            size='5xl'
            numeric
            className='mt-2'
          >
            12
          </Poster>
        </div>
        <div>
          <Poster
            size='sm'
            truncate
          >
            Грудь и трицепс
          </Poster>
          <Text
            size='xs'
            tone='muted'
          >
            6 упражнений · на очереди
          </Text>
        </div>
        <div>
          <Text size='lg'>Жим гантелей на наклонной скамье</Text>
          <Text
            size='xs'
            tone='muted'
            className='mt-1'
          >
            Грудь · Гантели
          </Text>
        </div>
      </div>
    </ScreenSection>
  </>
)
