import { complexLetter, planText, useTemplates } from '@/entities/program'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Eyebrow, Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

type TemplatePreviewSheetProps = {
  templateId: number | null
  onOpenChange: (open: boolean) => void
  onPick: (templateId: number) => void
}

// Состав шаблона прямо на шаге настройки: уйти на экран шаблона значило бы потерять шаг.
// Отдельного запроса нет — шаблоны приходят списком с составом
export const TemplatePreviewSheet = ({ templateId, onOpenChange, onPick }: TemplatePreviewSheetProps) => {
  const templates = useTemplates()
  const template = templates.data?.find(t => t.id === templateId)

  return (
    <Sheet
      open={templateId != null}
      onOpenChange={onOpenChange}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{template?.name ?? 'Шаблон'}</SheetTitle>
          <SheetDescription>{template?.description ?? 'Комплексы идут по очереди, по кругу.'}</SheetDescription>
        </SheetHeader>
        <div className='px-gutter min-h-0 flex-1 overflow-y-auto pb-2'>
          <QueryScreen
            query={templates}
            className=''
          >
            {() =>
              template && (
                <div className='flex flex-col gap-5'>
                  {template.complexes.map((c, i) => (
                    <section
                      key={c.id}
                      className='flex flex-col gap-1'
                    >
                      <Eyebrow>
                        {complexLetter(i)} · {c.name}
                      </Eyebrow>
                      <List>
                        {c.exercises.map(e => (
                          <ListRow
                            key={e.id}
                            title={e.name}
                            meta={e.muscles}
                            trail={
                              <Poster
                                as='span'
                                size='xs'
                                className='whitespace-nowrap'
                              >
                                {planText(e.sets, e.repsMin, e.repsMax)}
                              </Poster>
                            }
                          />
                        ))}
                      </List>
                    </section>
                  ))}
                  <Text
                    size='xs'
                    tone='muted'
                  >
                    Шаблон станет твоей программой — его можно будет править.
                  </Text>
                </div>
              )
            }
          </QueryScreen>
        </div>
        <div className='px-gutter pt-2 pb-6'>
          <Button
            size='lg'
            className='w-full'
            disabled={!template}
            onClick={() => template && onPick(template.id)}
          >
            Выбрать
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
