import { useTemplates } from '@/entities/program'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet'

type TemplatePreviewSheetProps = {
  templateId: number | null
  onOpenChange: (open: boolean) => void
  onPick: (templateId: number) => void
}

// Состав шаблона прямо на шаге настройки: уйти на экран шаблона значило бы потерять шаг.
// Отдельного запроса нет — шаблоны приходят списком с составом
export const TemplatePreviewSheet = ({ templateId, onOpenChange, onPick }: TemplatePreviewSheetProps) => {
  const templates = useTemplates()
  const template = templates.data?.find(t => t.id === templateId) ?? null

  return (
    <ProgramPreviewSheet
      program={template}
      onOpenChange={onOpenChange}
      note='Шаблон станет твоей программой — его можно будет править.'
      action={
        <Button
          size='lg'
          className='w-full'
          disabled={!template}
          onClick={() => template && onPick(template.id)}
        >
          Выбрать
        </Button>
      }
    />
  )
}
