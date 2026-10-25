import { useNavigate } from 'react-router'

import { useCreateProgram } from '@sportbot/api/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'

// Название не спрашиваем: его меняют в редакторе, куда сразу и попадаем
const DEFAULT_NAME = 'Новая программа'

/** «Собрать с нуля»: пустая программа и сразу её редактор */
export const useCreateBlankProgram = () => {
  const create = useCreateProgram()
  const navigate = useNavigate()

  return {
    create: () =>
      create.mutateAsync(DEFAULT_NAME).then(program => navigate(buildPath(ROUTES.PROGRAM, { programId: program.id }))),
    isPending: create.isPending,
  }
}
