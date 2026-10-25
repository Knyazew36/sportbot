import { CloudOffIcon, RefreshCwIcon } from 'lucide-react'

import { useWorkoutSync } from '@sportbot/api/entities/workout'
import { Text } from '@/shared/ui/kit/Typography'

// Строка под шапкой тренировки: в зале сеть пропадает, и человек должен видеть, что подходы не потерялись.
// При нормальной сети молчит: подход уходит за доли секунды, мигать строкой незачем
export const SyncStatus = () => {
  const { online, pending, retrying } = useWorkoutSync()
  if (online && !retrying) return null

  const Icon = online ? RefreshCwIcon : CloudOffIcon
  const text = online
    ? `Сеть плохая · отправляем: ${pending}`
    : pending
      ? `Нет сети · ждут отправки: ${pending}`
      : 'Нет сети · подходы сохранятся на телефоне'

  return (
    <Text
      size='sm'
      tone='muted'
      role='status'
      className='flex items-center gap-1.5 px-gutter'
    >
      <Icon className='size-3.5 shrink-0' />
      {text}
    </Text>
  )
}
