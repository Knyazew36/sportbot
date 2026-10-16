import { complexLetter, planText, type ProgramComplex } from '@/entities/program'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type ComplexSheetProps = {
  /** Открытый комплекс и его место в очереди; null — шторка закрыта */
  complex: { complex: ProgramComplex; index: number } | null
  onClose: () => void
}

// Состав комплекса из очереди: что в нём за упражнения и сколько подходов, без перехода в редактор
export const ComplexSheet = ({ complex, onClose }: ComplexSheetProps) => {
  const c = complex?.complex
  return (
    <Sheet
      open={complex !== null}
      onOpenChange={open => !open && onClose()}
    >
      <SheetContent>
        {c && complex && (
          <>
            <SheetHeader>
              <SheetTitle>
                {complexLetter(complex.index)} · {c.name}
              </SheetTitle>
              <SheetDescription>
                {c.exercises.length} упр.{c.isNext ? ' · на очереди' : ''}
              </SheetDescription>
            </SheetHeader>
            <div className='min-h-0 overflow-y-auto px-gutter pb-6'>
              {c.exercises.length === 0 && !c.cardioName ? (
                <Text tone='soft'>В комплексе пока нет упражнений — добавь их в редакторе программы.</Text>
              ) : (
                <List>
                  {c.exercises.map((e, i) => (
                    <ListRow
                      key={e.id}
                      lead={String(i + 1).padStart(2, '0')}
                      title={e.name}
                      meta={e.muscles || undefined}
                      trail={
                        <Poster
                          as='span'
                          className='whitespace-nowrap'
                        >
                          {planText(e.sets, e.repsMin, e.repsMax)}
                        </Poster>
                      }
                    />
                  ))}
                  {c.cardioName && (
                    <ListRow
                      lead='+'
                      title={c.cardioName}
                      meta='кардио'
                      trail={
                        c.cardioMinutes ? (
                          <Poster
                            as='span'
                            className='whitespace-nowrap'
                          >
                            {c.cardioMinutes} мин
                          </Poster>
                        ) : undefined
                      }
                    />
                  )}
                </List>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
