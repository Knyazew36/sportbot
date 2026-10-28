import { View } from 'react-native';

import { useEveningAnswer } from '@/shared/local/entities/day';

import { Button } from '@/shared/ui/kit/Button';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';

// Вечерний вопрос бота, на который можно ответить и здесь — порт EveningQuestion.tsx:
// ответ в приложении бот больше не спрашивает
export const EveningQuestion = ({ onMissed }: { onMissed: (suggestPause: boolean) => void }) => {
  const answer = useEveningAnswer();

  return (
    <Rise className="border-primary mx-gutter gap-3 border-[1.5px] p-4">
      <Eyebrow tone="primary">Вопрос бота</Eyebrow>
      <Poster size="lg">Потренировался сегодня?</Poster>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button block disabled={answer.isPending} onPress={() => answer.mutate(true)}>
            Да
          </Button>
        </View>
        <View className="flex-1">
          <Button
            block
            variant="outline"
            disabled={answer.isPending}
            onPress={() => answer.mutate(false, { onSuccess: (result) => onMissed(result.suggestPause) })}
          >
            Нет
          </Button>
        </View>
      </View>
    </Rise>
  );
};
