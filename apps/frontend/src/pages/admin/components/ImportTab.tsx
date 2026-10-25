import { CheckIcon } from 'lucide-react'

import { useState } from 'react'

import { type ImportReport, useImportApply, useImportCheck } from '@sportbot/api/entities/admin'
import { FileDrop } from '@/shared/ui/kit/FileDrop'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

const Report = ({ title, report }: { title: string; report: ImportReport }) => (
  <>
    <Rise className='px-gutter'>
      <Eyebrow
        as='p'
        tone='primary'
        className='mb-3'
      >
        {title}
      </Eyebrow>
      <StatGrid
        framed
        items={[
          { label: 'создать', value: report.create },
          { label: 'обновить', value: report.update },
          { label: 'ошибок', value: report.errors.length },
        ]}
      />
    </Rise>
    {report.errors.length > 0 && (
      <ScreenSection
        title='Ошибки по строкам'
        aside='эти записи пропущены'
      >
        <List>
          {report.errors.map(e => (
            <ListRow
              key={e}
              title={<span className='text-destructive text-[14px]'>{e}</span>}
            />
          ))}
        </List>
      </ScreenSection>
    )}
  </>
)

// Импорт справочника файлом (frontend-tz, 14.6): сначала проверка с отчётом, потом применение
export const ImportTab = () => {
  const [file, setFile] = useState<File | null>(null)
  const check = useImportCheck()
  const apply = useImportApply()

  const pick = (next: File) => {
    setFile(next)
    apply.reset()
    check.mutate(next)
  }

  return (
    <>
      <Rise className='px-gutter flex flex-col gap-3'>
        <Text tone='soft'>
          Файл с упражнениями, растяжками и шаблонами. Повторный импорт обновляет записи по коду, дублей не создаёт.
        </Text>
        <FileDrop
          accept='.json,application/json'
          title={file ? 'Выбрать другой файл' : 'Выбрать файл импорта'}
          hint='JSON, как catalog.json'
          onFile={pick}
        />
      </Rise>

      {apply.data ? (
        <Report
          title={`Применено · ${file?.name}`}
          report={apply.data}
        />
      ) : (
        check.data &&
        file && (
          <>
            <Report
              title={`Проверка · ${file.name}`}
              report={check.data}
            />
            <Rise className='px-gutter'>
              <Button
                size='lg'
                className='w-full'
                disabled={apply.isPending || check.data.create + check.data.update === 0}
                onClick={() => apply.mutate(file)}
              >
                <CheckIcon strokeWidth={3} />
                Применить
              </Button>
            </Rise>
          </>
        )
      )}
    </>
  )
}
