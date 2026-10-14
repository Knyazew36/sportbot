import { useNavigate, useParams } from 'react-router'

import {
  useAdminTemplate,
  useDeleteTemplateComplex,
  useDeleteTemplateExercise,
  useRenameTemplateComplex,
  useReorderTemplateExercises,
  useUpdateTemplateExercise,
} from '@/entities/admin'
import { complexLetter, type Program } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { arrangeBy } from '@/widgets/program-editor/arrange'
import { type ComplexActions, ComplexEditor } from '@/widgets/program-editor/ComplexEditor'

// Каждая правка сразу уходит на сервер; пока перестановка сохраняется, показываем новый порядок, а не старый
const useComplexActions = (onDeleted: () => void) => {
  const renameComplex = useRenameTemplateComplex()
  const deleteComplex = useDeleteTemplateComplex()
  const updateExercise = useUpdateTemplateExercise()
  const deleteExercise = useDeleteTemplateExercise()
  const reorderExercises = useReorderTemplateExercises()

  const actions: ComplexActions = {
    renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
    deleteComplex: id => deleteComplex.mutateAsync(id).then(onDeleted),
    updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
    deleteExercise: id => deleteExercise.mutate(id),
    reorderExercises: (complexId, ids) => reorderExercises.mutate({ complexId, ids }),
  }

  const pick = (template: Program, complexId: number) => {
    const index = template.complexes.findIndex(c => c.id === complexId)
    const complex = template.complexes[index]
    if (!complex) return null
    const exercises = reorderExercises.isPending && reorderExercises.variables.complexId === complexId
      ? arrangeBy(complex.exercises, reorderExercises.variables.ids)
      : complex.exercises
    return { complex: { ...complex, exercises }, letter: complexLetter(index) }
  }

  return { actions, pick }
}

// Комплекс шаблона на отдельной странице — как у программ пользователя (frontend-tz, 14.2)
const TemplateComplexPage = () => {
  const params = useParams()
  const templateId = Number(params.templateId)
  const complexId = Number(params.complexId)
  const navigate = useNavigate()
  const template = useAdminTemplate(templateId)
  const back = buildPath(ROUTES.ADMIN_TEMPLATE, { templateId })
  const { actions, pick } = useComplexActions(() => navigate(back, { replace: true }))
  const current = template.data ? pick(template.data, complexId) : null

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={current?.complex.name ?? 'Комплекс'}
          subtitle={current ? `комплекс ${current.letter} · ${template.data?.name}` : undefined}
          action={
            <ButtonLink
              to={back}
              size='sm'
            >
              Готово
            </ButtonLink>
          }
        />
      }
    >
      <QueryScreen
        query={template}
        isEmpty={p => !pick(p, complexId)}
        empty={{ title: 'Комплекса нет', description: 'Его уже удалили. Вернись в программу.' }}
      >
        {p => {
          const found = pick(p, complexId)
          return (
            found && (
              <ComplexEditor
                complex={found.complex}
                actions={actions}
                addExerciseTo={buildPath(ROUTES.ADMIN_TEMPLATE_ADD_EXERCISE, { templateId, complexId })}
              />
            )
          )
        }}
      </QueryScreen>
    </Screen>
  )
}

export default TemplateComplexPage
