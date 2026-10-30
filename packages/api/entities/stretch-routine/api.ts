import { useMutation, useQuery } from '@tanstack/react-query'

import type { StretchRoutineResponseDto, StretchSessionResponseDto } from '../../generated/model'
import { stretchRoutineControllerFind, stretchRoutineControllerList } from '../../generated/stretch-routine/stretch-routine'
import { stretchSessionControllerCreate, stretchSessionControllerUpdate } from '../../generated/stretch-session/stretch-session'

export type StretchRoutine = StretchRoutineResponseDto
export type StretchSession = StretchSessionResponseDto

export const stretchRoutineKeys = {
  list: ['stretch-routine', 'list'] as const,
  detail: (id: number) => ['stretch-routine', id] as const,
}

export const useStretchRoutines = () =>
  useQuery({ queryKey: stretchRoutineKeys.list, queryFn: () => stretchRoutineControllerList() })

export const useStretchRoutine = (id: number) =>
  useQuery({ queryKey: stretchRoutineKeys.detail(id), queryFn: () => stretchRoutineControllerFind(id) })

export const useStartStretchSession = () =>
  useMutation({
    mutationFn: (routineId: number) =>
      stretchSessionControllerCreate({ routineId, at: new Date().toISOString() }),
    // Занятие уже идёт на экране — отметка начала фоновая
    meta: { skipSuccessToast: true },
  })

export const useFinishStretchSession = () =>
  useMutation({
    mutationFn: (id: number) => stretchSessionControllerUpdate(id, { finishedAt: new Date().toISOString() }),
    meta: { successMessage: 'Занятие записано' },
  })
