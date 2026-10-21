import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  stretchExclusionControllerCreate,
  stretchExclusionControllerList,
  stretchExclusionControllerRemove,
} from '@/shared/api/generated/stretch-exclusion/stretch-exclusion'
import type { StretchExclusionResponseDto } from '@/shared/api/generated/model'

export type StretchExclusion = StretchExclusionResponseDto

export const stretchExclusionKeys = {
  list: ['stretch-exclusion', 'list'] as const,
}

/** Растяжки, которые заминка не предлагает: список в профиле и пометка на карточке справочника */
export const useStretchExclusions = () =>
  useQuery({
    queryKey: stretchExclusionKeys.list,
    queryFn: () => stretchExclusionControllerList(),
  })

/** Исключена ли растяжка; пока список грузится — нет */
export const useIsStretchExcluded = (stretchId: number) => {
  const { data } = useStretchExclusions()
  return data?.some(e => e.stretchId === stretchId) ?? false
}

const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: stretchExclusionKeys.list })
}

export const useCreateStretchExclusion = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (stretchId: number) => stretchExclusionControllerCreate({ stretchId }),
    meta: { successMessage: 'Больше не предложим в заминке' },
    onSuccess: invalidate,
  })
}

export const useDeleteStretchExclusion = () => {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (stretchId: number) => stretchExclusionControllerRemove(stretchId),
    meta: { successMessage: 'Растяжка снова в заминке' },
    onSuccess: invalidate,
  })
}
