import { useMutation, useQueryClient } from '@tanstack/react-query';

import { stretchExclusionKeys } from '@sportbot/api/entities/stretch-exclusion';
import { workoutKeys } from '@sportbot/api/entities/workout';
import { workoutControllerCooldownExclude } from '@sportbot/api/generated/workout/workout';

type Vars = { workoutId: number; stretchId: number };

/**
 * «Не предлагать» в заминке: растяжка исключается навсегда, а в этой заминке сервер меняет её
 * на другую на те же мышцы (или убирает, если замены нет). Ответ — уже новая заминка,
 * кладём её в кэш без перезапроса; список исключённых в профиле перечитываем
 */
export const useExcludeCooldownStretch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, stretchId }: Vars) => workoutControllerCooldownExclude(workoutId, { stretchId }),
    meta: { successMessage: 'Больше не предложим эту растяжку' },
    onSuccess: (cooldown, { workoutId }) => {
      queryClient.setQueryData(workoutKeys.cooldown(workoutId), cooldown);
      void queryClient.invalidateQueries({ queryKey: stretchExclusionKeys.list });
    },
  });
};
