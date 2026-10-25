import { useEveningAnswer } from '@sportbot/api/entities/day'
import { Rise } from '@/shared/ui/kit/Reveal'
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography'
import { Button } from '@/shared/ui/shadcn/animate-ui/components/buttons/button'

// Вечерний вопрос бота, на который можно ответить и здесь: ответ в приложении бот больше не спрашивает
export const EveningQuestion = ({ onMissed }: { onMissed: (suggestPause: boolean) => void }) => {
  const answer = useEveningAnswer()

  return (
    <Rise className='border-primary mx-gutter flex flex-col gap-3 border-[1.5px] p-4'>
      <Eyebrow tone='primary'>Вопрос бота</Eyebrow>
      <Poster size='lg'>Потренировался сегодня?</Poster>
      <div className='grid grid-cols-2 gap-2'>
        <Button
          disabled={answer.isPending}
          onClick={() => answer.mutate(true)}
        >
          Да
        </Button>
        <Button
          variant='outline'
          disabled={answer.isPending}
          onClick={() => answer.mutate(false, { onSuccess: result => onMissed(result.suggestPause) })}
        >
          Нет
        </Button>
      </div>
    </Rise>
  )
}
