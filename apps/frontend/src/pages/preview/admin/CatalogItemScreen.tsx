import { useNavigate, useParams, useSearchParams } from 'react-router'

import { useState } from 'react'

import { type Equipment, EQUIPMENT_LABEL } from '@/entities/catalog/types'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { cn } from '@/shared/lib/utils'
import { CatalogImage } from '@/shared/ui/kit/CatalogImage'
import { FileDrop } from '@/shared/ui/kit/FileDrop'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Segmented } from '@/shared/ui/kit/Segmented'
import { SettingRow } from '@/shared/ui/kit/SettingRow'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'
import { Switch } from '@/shared/ui/shadcn/animate-ui/components/radix/switch'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { Textarea } from '@/shared/ui/shadcn/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/shadcn/toggle-group'

import { moderationQueue } from '../model/admin'
import { exercises, joints, muscles, stretches } from '../model/catalog'

type Role = 'PRIMARY' | 'SECONDARY'

const EQUIPMENT = (Object.keys(EQUIPMENT_LABEL) as Equipment[]).map(value => ({ value, label: EQUIPMENT_LABEL[value] }))

// Роль мышцы одним нажатием по кругу: нет → основная → вспомогательная → нет.
// Два отдельных списка по 16 мышц заняли бы два экрана
const MuscleRoles = ({
  value,
  onChange,
}: {
  value: Record<string, Role>
  onChange: (next: Record<string, Role>) => void
}) => {
  const cycle = (code: string) => {
    const next = { ...value }
    if (!next[code]) next[code] = 'PRIMARY'
    else if (next[code] === 'PRIMARY') next[code] = 'SECONDARY'
    else delete next[code]
    onChange(next)
  }

  return (
    <div className='grid grid-cols-2 gap-2'>
      {muscles.map(m => {
        const role = value[m.code]
        return (
          <Button
            key={m.code}
            variant={role === 'PRIMARY' ? 'default' : role === 'SECONDARY' ? 'alert' : 'outline'}
            size='sm'
            onClick={() => cycle(m.code)}
            aria-label={`${m.name}: ${role === 'PRIMARY' ? 'основная' : role === 'SECONDARY' ? 'вспомогательная' : 'не участвует'}`}
            className={cn('h-11 justify-between px-3', !role && 'text-foreground/60')}
          >
            <span className='truncate'>{m.name}</span>
            {role && (
              <Eyebrow
                size='sm'
                tone='inherit'
              >
                {role === 'PRIMARY' ? 'осн' : 'всп'}
              </Eyebrow>
            )}
          </Button>
        )
      })}
    </div>
  )
}

// Создание и правка записи справочника (frontend-tz, 14.1). ?request=N — «одобрить с правками»:
// форма открывается с данными заявки автора (14.3)
const CatalogItemScreen = () => {
  const { kind: kindParam, itemId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const kind = kindParam === 'stretch' ? 'stretch' : 'exercise'
  const isNew = itemId === 'new'

  const request = moderationQueue.find(r => String(r.id) === search.get('request'))
  const exercise = kind === 'exercise' ? exercises.find(e => String(e.id) === itemId) : undefined
  const stretch = kind === 'stretch' ? stretches.find(s => String(s.id) === itemId) : undefined

  const [name, setName] = useState(request?.name ?? exercise?.name ?? stretch?.name ?? '')
  const [image, setImage] = useState<string | null>(exercise?.imageUrl ?? stretch?.imageUrl ?? null)
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'BARBELL')
  const [roles, setRoles] = useState<Record<string, Role>>(() => ({
    ...Object.fromEntries((exercise?.secondaryMuscles ?? []).map(m => [m.code, 'SECONDARY' as const])),
    ...Object.fromEntries(
      (exercise?.primaryMuscles ?? request?.muscles.map(code => ({ code })) ?? []).map(m => [
        m.code,
        'PRIMARY' as const,
      ]),
    ),
  }))
  const [stretchMuscles, setStretchMuscles] = useState<string[]>(
    stretch?.muscles.map(m => m.code) ?? request?.muscles ?? [],
  )
  const [exerciseJoints, setExerciseJoints] = useState<string[]>(exercise?.joints.map(j => j.code) ?? [])
  const [perSide, setPerSide] = useState(stretch?.perSide ?? request?.perSide ?? false)

  const back = request
    ? buildPath(ROUTES.PREVIEW_ADMIN_MODERATION, { requestId: request.id })
    : `${ROUTES.PREVIEW_ADMIN}?tab=catalog`
  const done = `${ROUTES.PREVIEW_ADMIN}?tab=${request ? 'moderation' : 'catalog'}`
  const hasMuscles = kind === 'exercise' ? Object.values(roles).includes('PRIMARY') : stretchMuscles.length > 0
  const noun = kind === 'exercise' ? 'упражнение' : 'растяжка'

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={request ? 'Одобрить с правками' : isNew ? `Новая запись` : name || 'Запись'}
          subtitle={request ? `заявка от ${request.author} · ${noun}` : noun}
        />
      }
      footer={
        <StickyFooter>
          <Button
            size='lg'
            className='w-full'
            disabled={name.trim().length < 3 || !hasMuscles}
            onClick={() => navigate(done)}
          >
            {request ? 'Одобрить и сохранить' : 'Сохранить'}
          </Button>
          {!hasMuscles && (
            <Text
              size='xs'
              tone='danger'
              className='mt-2 text-center'
            >
              Укажи хотя бы одну {kind === 'exercise' ? 'основную ' : ''}мышцу
            </Text>
          )}
        </StickyFooter>
      }
      className='gap-8'
    >
      <Rise className='flex flex-col gap-2 px-5'>
        <Label htmlFor='item-name'>Название</Label>
        <Input
          id='item-name'
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </Rise>

      <ScreenSection
        title='Картинка'
        aside={image ? undefined : 'пока нет'}
      >
        <CatalogImage
          src={image}
          alt={name}
          size='cover'
        />
        <FileDrop
          accept='image/jpeg,image/png,image/webp'
          title={image ? 'Заменить картинку' : 'Загрузить картинку'}
          hint='JPEG, PNG или WebP, до 5 МБ'
          onFile={file => setImage(URL.createObjectURL(file))}
        />
      </ScreenSection>

      {kind === 'exercise' ? (
        <>
          <ScreenSection title='Инвентарь'>
            <div className='no-scrollbar -mx-5 overflow-x-auto px-5 pb-1'>
              <Segmented
                options={EQUIPMENT}
                value={equipment}
                onValueChange={setEquipment}
              />
            </div>
          </ScreenSection>
          <ScreenSection
            title='Мышцы'
            aside='нажимай: осн → всп → нет'
          >
            <MuscleRoles
              value={roles}
              onChange={setRoles}
            />
          </ScreenSection>
          <ScreenSection
            title='Суставы'
            aside='для ограничений'
          >
            <ToggleGroup
              multiple
              value={exerciseJoints}
              onValueChange={setExerciseJoints}
              className='grid w-full grid-cols-2 gap-2'
            >
              {joints.map(j => (
                <ToggleGroupItem
                  key={j.code}
                  value={j.code}
                  className='h-11 justify-start px-3'
                >
                  {j.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScreenSection>
          <ScreenSection title='Описание'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='item-technique'>Техника</Label>
              <Textarea
                id='item-technique'
                defaultValue={exercise?.technique ?? request?.text ?? ''}
                placeholder={'Ключевые пункты одним абзацем.\nОшибки: первая, вторая, третья.'}
              />
              <Text
                size='xs'
                tone='muted'
              >
                Строка «Ошибки: …» станет в карточке блоком типичных ошибок.
              </Text>
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='item-video'>Ссылка на видео</Label>
              <Input
                id='item-video'
                type='url'
                inputMode='url'
                defaultValue={exercise?.videoUrl ?? request?.videoUrl ?? ''}
                placeholder='https://'
              />
            </div>
          </ScreenSection>
        </>
      ) : (
        <>
          <ScreenSection title='Мышцы'>
            <ToggleGroup
              multiple
              value={stretchMuscles}
              onValueChange={setStretchMuscles}
              className='grid w-full grid-cols-2 gap-2'
            >
              {muscles.map(m => (
                <ToggleGroupItem
                  key={m.code}
                  value={m.code}
                  className='h-11 justify-start px-3'
                >
                  {m.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </ScreenSection>
          <ScreenSection title='Удержание'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='item-hold'>Время, секунд</Label>
              <Input
                id='item-hold'
                type='number'
                inputMode='numeric'
                min={5}
                defaultValue={stretch?.holdSeconds ?? request?.holdSeconds ?? 30}
              />
            </div>
            <SettingRow
              title='На каждую сторону'
              hint='Время удваивается'
              htmlFor='item-per-side'
              className='border-t-[1.5px]'
            >
              <Switch
                id='item-per-side'
                checked={perSide}
                onCheckedChange={setPerSide}
              />
            </SettingRow>
          </ScreenSection>
          <ScreenSection title='Описание'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='item-howto'>Как делать</Label>
              <Textarea
                id='item-howto'
                defaultValue={stretch?.howTo ?? request?.text ?? ''}
              />
            </div>
          </ScreenSection>
        </>
      )}
    </Screen>
  )
}

export default CatalogItemScreen
