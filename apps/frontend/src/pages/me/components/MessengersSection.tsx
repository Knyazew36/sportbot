import { CheckIcon, LinkIcon } from 'lucide-react'

import {
  type Messenger,
  MESSENGER_LABEL,
  useCreateLinkCode,
  useLinkState,
  useSetNotify,
  useUnlink,
} from '@/entities/link'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction'
import { List, ListRow } from '@/shared/ui/kit/ListRow'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Label } from '@/shared/ui/shadcn/label'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/shadcn/sheet'

const ALL: Messenger[] = ['TELEGRAM', 'MAX']
const BOTH = 'BOTH'

// Мессенджеры (frontend-tz, 13.7): привязка второго по одноразовой ссылке, отвязка, куда слать вопросы
export const MessengersSection = () => {
  const state = useLinkState()
  const code = useCreateLinkCode()
  const unlink = useUnlink()
  const notify = useSetNotify()
  const linked = state.data?.linked ?? []
  const notifyValue = state.data?.notify.length === 2 ? BOTH : (state.data?.notify[0] ?? '')

  return (
    <ScreenSection
      variant='block'
      index={7}
      title='Мессенджеры'
    >
      <List>
        {ALL.map(m => {
          const isLinked = linked.includes(m)
          return (
            <ListRow
              key={m}
              title={MESSENGER_LABEL[m]}
              meta={isLinked ? 'привязан' : 'не привязан'}
              trail={
                isLinked ? (
                  // Отвязать можно, только пока остаётся второй — иначе это удаление аккаунта
                  linked.length > 1 ? (
                    <ConfirmAction
                      trigger={
                        <Button
                          variant='outline'
                          size='xs'
                        />
                      }
                      title={`Отвязать ${MESSENGER_LABEL[m]}?`}
                      description='Чат с ботом там начнётся с нуля. История останется в аккаунте.'
                      confirmLabel='Отвязать'
                      onConfirm={() => unlink.mutateAsync(m)}
                    >
                      Отвязать
                    </ConfirmAction>
                  ) : (
                    <Badge>
                      <CheckIcon />
                      привязан
                    </Badge>
                  )
                ) : (
                  state.data?.available.includes(m) && (
                    <Button
                      variant='outline'
                      size='xs'
                      disabled={code.isPending}
                      onClick={() => code.mutate()}
                    >
                      <LinkIcon />
                      Привязать
                    </Button>
                  )
                )
              }
            />
          )
        })}
      </List>
      {linked.length > 1 && (
        <div className='flex flex-col gap-2'>
          <Label>Куда присылать вопросы и напоминания</Label>
          <Segmented
            options={[
              { value: 'TELEGRAM', label: 'Telegram' },
              { value: 'MAX', label: 'MAX' },
              { value: BOTH, label: 'Оба' },
            ]}
            value={notifyValue}
            onValueChange={v => notify.mutate(v === BOTH ? ALL : [v as Messenger])}
            stretch
          />
        </div>
      )}

      {/* Привязка второго мессенджера: одноразовая ссылка на бота, как в боте (business-tz, 22.4) */}
      <Sheet
        open={code.data != null}
        onOpenChange={open => !open && code.reset()}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Привязать {code.data && MESSENGER_LABEL[code.data.channel]}</SheetTitle>
            <SheetDescription>
              Открой ссылку и нажми «Старт» у бота — аккаунты объединятся, история останется одна.
            </SheetDescription>
          </SheetHeader>
          <div className='px-gutter flex flex-col gap-3 pb-6'>
            {code.data && (
              <ButtonLink
                to={code.data.url}
                size='lg'
                className='w-full'
              >
                Открыть {MESSENGER_LABEL[code.data.channel]}
              </ButtonLink>
            )}
            <Text
              size='xs'
              tone='muted'
            >
              Ссылка одноразовая и действует 15 минут.
            </Text>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => {
                code.reset()
                void state.refetch()
              }}
            >
              Готово
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </ScreenSection>
  )
}
