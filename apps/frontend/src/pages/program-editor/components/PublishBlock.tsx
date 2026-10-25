import { GlobeIcon, PencilIcon } from 'lucide-react'

import { useState } from 'react'

import { isPublishable, type Program, publishLabel, useUnpublishProgram } from '@sportbot/api/entities/program'
import { PUBLICATION_STATUS } from '@/features/publish-program/publication-status'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { StatusFromMeta } from '@/shared/ui/kit/StatusBadge'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

import { PublishSheet } from '@/features/publish-program/PublishSheet'

// Публикация своей программы в «Программы пользователей». Копии чужих программ публиковать нельзя —
// каталог наполнился бы клонами оригинала, поэтому у них блока нет
export const PublishBlock = ({ program: p, index }: { program: Program; index?: number }) => {
  const [open, setOpen] = useState(false)
  const unpublish = useUnpublishProgram()
  if (!isPublishable(p)) return null

  const listed = p.publication === 'PENDING' || p.publication === 'PUBLISHED'

  return (
    <ScreenSection
      variant='block'
      index={index}
      title='Каталог'
    >
      <div className='flex flex-col gap-3'>
        <StatusFromMeta meta={PUBLICATION_STATUS[p.publication]} />

        {p.publication === 'DRAFT' && (
          <Text tone='soft'>Поделись программой: её увидят все в «Программах пользователей» и смогут взять себе.</Text>
        )}
        {p.publication === 'PENDING' && <Text tone='soft'>Администратор проверит программу — ответ придёт в бот.</Text>}
        {p.publication === 'PUBLISHED' && (
          <Text tone='soft'>
            Взяли себе: {pluralize(p.addedCount, ['раз', 'раза', 'раз'])}. Правки упражнений сразу видны в каталоге.
          </Text>
        )}
        {p.publication === 'PUBLISHED' && p.textPending && (
          <Text tone='soft'>Новое название или описание на проверке — в каталоге пока прежнее.</Text>
        )}
        {p.rejectReason && <Text tone='danger'>Причина: {p.rejectReason}</Text>}

        <Button
          // Уже отправленную только правят — это не выход наружу, поэтому без «медали»
          variant={listed ? 'outline' : 'share'}
          className='w-full'
          onClick={() => setOpen(true)}
        >
          {listed ? <PencilIcon /> : <GlobeIcon />}
          {publishLabel(p.publication)}
        </Button>

        {listed && (
          <ConfirmAction
            trigger={
              <Button
                variant='ghost'
                className='w-full'
              />
            }
            title='Снять с публикации?'
            description='Программа пропадёт из каталога. У тех, кто её уже взял, копии останутся.'
            confirmLabel='Снять'
            confirmVariant='default'
            onConfirm={() => unpublish.mutateAsync(p.id)}
          >
            Снять с публикации
          </ConfirmAction>
        )}
      </div>

      <PublishSheet
        program={p}
        open={open}
        onOpenChange={setOpen}
      />
    </ScreenSection>
  )
}
