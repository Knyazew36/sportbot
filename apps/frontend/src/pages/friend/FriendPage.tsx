import { CheckIcon, CopyIcon, PauseIcon, UserMinusIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router'

import { useState } from 'react'

import { useCopyFriendProgram, useFriend, useUnfriend } from '@/entities/social'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { formatDate } from '@/shared/lib/format'
import { pluralize } from '@front-cmdt/utils/pluralize'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Poster, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ProgramPreviewSheet } from '@/widgets/program-preview/ProgramPreviewSheet'
import { AttendanceSection } from '@/widgets/stats/AttendanceSection'
import { CalendarSection } from '@/widgets/stats/CalendarSection'
import { MuscleLoadSection } from '@/widgets/stats/MuscleLoadSection'
import { PeriodBar } from '@/widgets/stats/PeriodBar'
import { usePeriod } from '@/widgets/stats/periods'
import { ProgressListSection } from '@/widgets/stats/ProgressListSection'
import { RecordsSection } from '@/widgets/stats/RecordsSection'
import { StatsSummarySection } from '@/widgets/stats/StatsSummarySection'

const BACK = buildPath(ROUTES.ME_SECTION, { section: 'friends' })

// Профиль друга (frontend-tz, 13.6): его статистика строго по таблице видимости — без веса тела и ограничений,
// пауза только статусом, программы с «Скопировать себе». Что можно показывать, решает бэк по userId
const FriendPage = () => {
  const friendId = Number(useParams().friendId)
  const navigate = useNavigate()
  const friend = useFriend(friendId)
  const copy = useCopyFriendProgram()
  const unfriend = useUnfriend()
  const [copied, setCopied] = useState<number[]>([])
  // Программа, чей состав открыт в шторке
  const [preview, setPreview] = useState<number | null>(null)
  const [period] = usePeriod()

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
    <Screen
      header={
        <TopBar
          back={BACK}
          title={friend.data?.displayName ?? 'Друг'}
        />
      }
      className='gap-10'
    >
      <QueryScreen query={friend}>
        {f => (
          <>
            <Rise className='px-gutter'>
              <Poster
                as='h1'
                size='display'
                tone='primary'
                fit
              >
                {f.displayName}
              </Poster>
              {f.paused && (
                <Badge
                  variant='outline'
                  className='mt-3'
                >
                  <PauseIcon />
                  на паузе {f.pauseEndDate ? `до ${formatDate(f.pauseEndDate, 'd MMMM')}` : 'до отмены'}
                </Badge>
              )}
            </Rise>

            <StatsSummarySection userId={f.id} />

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
                      meta={[pluralize(p.complexCount, ['комплекс', 'комплекса', 'комплексов']), p.active && 'активная']
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
                  Копия живёт у тебя в программах с пометкой «от {f.displayName}». Если друг её обновит — предложим
                  обновить и у тебя.
                </Text>
              </ScreenSection>
            )}

            <ProgramPreviewSheet
              program={f.programs.find(p => p.id === preview) ?? null}
              onOpenChange={open => !open && setPreview(null)}
              note={`Копия появится у тебя в программах с пометкой «от ${f.displayName}».`}
              action={preview != null && copyButton(preview, 'lg', 'w-full')}
            />

            <PeriodBar />
            <AttendanceSection
              period={period}
              userId={f.id}
            />
            <ProgressListSection
              period={period}
              userId={f.id}
            />
            <RecordsSection
              period={period}
              userId={f.id}
            />
            <MuscleLoadSection
              period={period}
              userId={f.id}
            />
            <CalendarSection userId={f.id} />

            <Rise className='px-gutter pb-6'>
              <ConfirmAction
                trigger={
                  <Button
                    variant='destructive'
                    className='w-full'
                  />
                }
                title={`Удалить ${f.displayName} из друзей?`}
                description='Уведомление не придёт. Статистика пропадёт у вас обоих, копии программ останутся.'
                confirmLabel='Удалить'
                onConfirm={() => unfriend.mutateAsync(f.id).then(() => navigate(BACK, { replace: true }))}
              >
                <UserMinusIcon />
                Удалить из друзей
              </ConfirmAction>
            </Rise>
          </>
        )}
      </QueryScreen>
    </Screen>
  )
}

export default FriendPage
