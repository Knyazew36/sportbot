import { pluralize } from '@front-cmdt/utils/pluralize'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { useState } from 'react'

import { type FriendProfile, useCopyFriendProgram } from '@sportbot/api/entities/social'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet'

// Программы друга с «Себе»: копия ложится в мои программы, состав можно посмотреть в шторке
export const FriendPrograms = ({ friend: f }: { friend: FriendProfile }) => {
  const copy = useCopyFriendProgram()
  const [copied, setCopied] = useState<number[]>([])
  // Программа, чей состав открыт в шторке
  const [preview, setPreview] = useState<number | null>(null)

  // Одна кнопка и в строке, и в шторке: «У тебя» после копирования видно в обоих местах
  const copyButton = (programId: number, size: 'xs' | 'lg', className?: string) => {
    const isCopied = copied.includes(programId)
    return (
      <Button
        variant={isCopied ? 'outline' : 'default'}
        size={size}
        className={className}
        disabled={isCopied || copy.isPending}
        onClick={() => copy.mutate(programId, { onSuccess: () => setCopied(ids => [...ids, programId]) })}
      >
        {isCopied ? <CheckIcon /> : <CopyIcon />}
        {isCopied ? 'У тебя' : 'Себе'}
      </Button>
    )
  }

  return (
    <>
      {f.programs.length > 0 && (
        <ScreenSection
          title='Программы'
          aside='можно забрать себе'
        >
          <List>
            {f.programs.map(p => (
              // Вся строка открывает состав: кнопка растянута на строку, «Себе» лежит поверх неё
              <ListRow
                key={p.id}
                className='hover:bg-accent/60 -mx-gutter px-gutter relative transition-colors'
                lead={String(p.complexCount).padStart(2, '0')}
                title={
                  <button
                    type='button'
                    className='text-left after:absolute after:inset-0'
                    onClick={() => setPreview(p.id)}
                  >
                    {p.name}
                  </button>
                }
                meta={[pluralize(p.complexCount, ['тренировка', 'тренировки', 'тренировок']), p.active && 'активная']
                  .filter(Boolean)
                  .join(' · ')}
                trail={copyButton(p.id, 'xs', 'relative z-10')}
              />
            ))}
          </List>
          <Text
            size='xs'
            tone='muted'
          >
            Копия живёт у тебя в программах с пометкой «от {f.displayName}». Если друг её обновит — предложим обновить
            и у тебя.
          </Text>
        </ScreenSection>
      )}

      <ProgramPreviewSheet
        program={f.programs.find(p => p.id === preview) ?? null}
        onOpenChange={open => !open && setPreview(null)}
        note={`Копия появится у тебя в программах с пометкой «от ${f.displayName}».`}
        action={preview != null && copyButton(preview, 'lg', 'w-full')}
      />
    </>
  )
}
