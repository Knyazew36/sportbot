import { useState } from 'react';
import { View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { Button } from '@/shared/ui/kit/Button';

import { ManualWorkoutSheet } from './ManualWorkoutSheet';

// Забыл отметить тренировку в боте или приложении — добавить её в посещения задним числом
export const AddWorkoutButton = () => {
  const [open, setOpen] = useState(false);
  return (
    <View className="px-gutter">
      <Button variant="outline" block icon={Plus} onPress={() => setOpen(true)}>
        Добавить тренировку вручную
      </Button>
      <ManualWorkoutSheet open={open} onOpenChange={setOpen} />
    </View>
  );
};
