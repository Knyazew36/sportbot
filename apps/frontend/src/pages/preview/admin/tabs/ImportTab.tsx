import { useState } from 'react'

import { FileDrop } from '@/shared/ui/kit/FileDrop'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { Rise } from '@/shared/ui/kit/Reveal'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatGrid } from '@/shared/ui/kit/StatGrid'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'

import { importReport } from '../../model/admin'

// Импорт справочника файлом и отчёт: создано, обновлено, ошибки по строкам (frontend-tz, 14.6)
export const ImportTab = () => {
  const [file, setFile] = useState<string | null>(null)

  return (
    <>
      <Rise className='flex flex-col gap-3 px-5'>
        <Text tone='soft'>
          Файл с упражнениями, растяжками и шаблонами. Повторный импорт обновляет записи по коду, дублей не создаёт.
        </Text>
        <FileDrop
          accept='.json,application/json'
          title={file ? 'Загрузить другой файл' : 'Выбрать файл импорта'}
          hint='JSON, как catalog.json'
          onFile={f => setFile(f.name)}
        />
      </Rise>

      {file && (
        <>
          <Rise className='px-5'>
            <Eyebrow
              as='p'
              tone='primary'
              className='mb-3'
            >
              Отчёт · {file}
            </Eyebrow>
            <StatGrid
              framed
              items={[
                { label: 'создано', value: importReport.created },
                { label: 'обновлено', value: importReport.updated },
                { label: 'ошибок', value: importReport.errors.length },
              ]}
            />
          </Rise>
          <ScreenSection
            title='Ошибки по строкам'
            aside='эти записи пропущены'
          >
            <List>
              {importReport.errors.map(e => (
                <ListRow
                  key={e.row}
                  title={<span className='font-mono text-[13px]'>{e.row}</span>}
                  meta={<span className='text-destructive'>{e.message}</span>}
                />
              ))}
            </List>
          </ScreenSection>
        </>
      )}
    </>
  )
}
