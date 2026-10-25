import { TriangleAlertIcon } from 'lucide-react'

import type { CatalogExercise } from '@sportbot/api/entities/catalog'
import { useLimitations } from '@sportbot/api/entities/limitation'
import { ScreenSection } from '@/shared/ui/kit/ScreenSection'
import { Eyebrow, Text } from '@/shared/ui/kit/Typography'
import { Badge } from '@/shared/ui/shadcn/badge'

// Мышцы и суставы. Суставы, на которые у пользователя действует ограничение, подсвечены
export const ExerciseMuscles = ({ exercise: e }: { exercise: CatalogExercise }) => {
  const limitations = useLimitations()
  const limited = new Set(limitations.data?.map(l => l.jointId))

  return (
    <ScreenSection title='Мышцы'>
      <dl className='grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-3'>
        <Eyebrow as='dt'>Основные</Eyebrow>
        <dd className='flex flex-wrap gap-1.5'>
          {e.primaryMuscles.map(m => (
            <Badge key={m.id}>{m.name}</Badge>
          ))}
        </dd>
        {e.secondaryMuscles.length > 0 && (
          <>
            <Eyebrow as='dt'>Помогают</Eyebrow>
            <dd className='flex flex-wrap gap-1.5'>
              {e.secondaryMuscles.map(m => (
                <Badge
                  key={m.id}
                  variant='outline'
                >
                  {m.name}
                </Badge>
              ))}
            </dd>
          </>
        )}
        {e.joints.length > 0 && (
          <>
            <Eyebrow as='dt'>Суставы под нагрузкой</Eyebrow>
            <dd className='flex flex-wrap gap-1.5'>
              {e.joints.map(j => (
                <Badge
                  key={j.id}
                  variant={limited.has(j.id) ? 'destructive' : 'outline'}
                >
                  {limited.has(j.id) && <TriangleAlertIcon />}
                  {j.name}
                </Badge>
              ))}
            </dd>
          </>
        )}
      </dl>
      {e.joints.some(j => limited.has(j.id)) && (
        <Text
          size='sm'
          tone='danger'
        >
          Нагружает сустав, на котором у тебя ограничение.
        </Text>
      )}
    </ScreenSection>
  )
}
