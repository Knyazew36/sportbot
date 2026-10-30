import { View } from 'react-native';
import { Dices } from 'lucide-react-native';

import { useMuscles } from '@/shared/local/entities/catalog';
import { Button } from '@/shared/ui/kit/Button';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import type { CooldownFlow } from '../model/use-cooldown-flow';

// Заминка показалась короткой или хочется лучше растянуть мышцу: случайная растяжка или на выбранную мышцу
export const CooldownAdd = ({ flow }: { flow: CooldownFlow }) => {
  const muscles = useMuscles();
  return (
    <View className="gap-3">
      <Button variant="outline" size="lg" block icon={Dices} disabled={flow.addPending} onPress={() => flow.addStretch()}>
        Случайная растяжка
      </Button>
      <Eyebrow>или на мышцу</Eyebrow>
      <View className="flex-row flex-wrap gap-2">
        {muscles.data?.map((muscle) => (
          <Button
            key={muscle.id}
            variant="outline"
            size="xs"
            disabled={flow.addPending}
            onPress={() => flow.addStretch(muscle.id)}
          >
            {muscle.name}
          </Button>
        ))}
      </View>
    </View>
  );
};
