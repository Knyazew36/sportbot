import { useState } from 'react';
import { router } from 'expo-router';

import { useReplaceItem, type WorkoutAnalog } from '@sportbot/api/entities/workout';
import { ROUTES } from '@/shared/config/routes';

export type ReplaceChoice = { id: number; name: string; draft?: boolean };

/**
 * Замена упражнения: что смотрим в шторке, на что меняем, открыта ли шторка создания своего.
 * Тап по строке — посмотреть упражнение; кнопка справа или «Заменить на это» — к выбору «сегодня или насовсем»
 */
export const useReplaceFlow = (itemId: number) => {
  const replace = useReplaceItem();
  // draft — своё упражнение, которое только что сохранили шторкой создания
  const [choice, setChoice] = useState<ReplaceChoice | null>(null);
  const [preview, setPreview] = useState<WorkoutAnalog | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const chooseFromPreview = () => {
    setChoice(preview);
    setPreview(null);
  };

  // Экран тренировки лежит под заменой в стеке — возвращаемся к нему, а не кладём новый
  const apply = (inComplex: boolean) => {
    if (!choice) return;
    void replace.mutateAsync({ itemId, exerciseId: choice.id, inComplex }).then(() => {
      if (router.canGoBack()) router.back();
      else router.replace(ROUTES.WORKOUT);
    });
  };

  return {
    choice,
    setChoice,
    preview,
    setPreview,
    chooseFromPreview,
    createOpen,
    setCreateOpen,
    apply,
    pending: replace.isPending,
  };
};
