import { useActiveProgram } from '@/entities/program'
import { ComplexQueue as ComplexQueueWidget } from '@/widgets/complex-queue/ComplexQueue'

// Очередь на «Сегодня»: в ответе дня у комплексов нет состава — для шторки берём активную программу целиком
export const ComplexQueue = ({ currentId, byQueue }: { currentId: number; byQueue: boolean }) => {
  const program = useActiveProgram()
  if (!program.data?.complexes.length) return null

  return (
    <ComplexQueueWidget
      complexes={program.data.complexes}
      activeId={currentId}
      aside={byQueue ? 'следующий подсвечен' : 'выбран вручную'}
    />
  )
}
