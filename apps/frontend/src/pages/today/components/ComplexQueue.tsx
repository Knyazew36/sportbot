import { useActiveProgram } from '@/entities/program'
import { ComplexQueue as ComplexQueueWidget } from '@/widgets/complex-queue/ComplexQueue'

// Очередь на «Сегодня»: в ответе дня у комплексов нет состава — для шторки берём активную программу целиком
type ComplexQueueProps = {
  currentId: number
  byQueue: boolean
  onPick: (id: number) => void
}

export const ComplexQueue = ({ currentId, byQueue, onPick }: ComplexQueueProps) => {
  const program = useActiveProgram()
  if (!program.data?.complexes.length) return null

  return (
    <ComplexQueueWidget
      complexes={program.data.complexes}
      activeId={currentId}
      aside={byQueue ? 'следующая подсвечена' : 'выбрана вручную'}
      onPick={onPick}
    />
  )
}
