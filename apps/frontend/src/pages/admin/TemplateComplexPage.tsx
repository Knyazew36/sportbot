import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'

import {
  adminTemplateKeys,
  useAdminTemplate,
  useDeleteTemplateComplex,
  useDeleteTemplateExercise,
  useRenameTemplateComplex,
  useReorderTemplateExercises,
  useUngroupTemplateExercise,
  useUngroupTemplateSuperset,
  useUpdateTemplateExercise,
} from '@/entities/admin'
import { complexLetter, type Program } from '@/entities/program'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ButtonLink } from '@/shared/ui/kit/ButtonLink'
import { QueryScreen } from '@/shared/ui/kit/QueryScreen'
import { Screen } from '@/shared/ui/kit/Screen'
import { TopBar } from '@/shared/ui/kit/ScreenHeader'
import { ComplexEditor } from '@/widgets/program-editor/ComplexEditor'
import { useComplexEditing } from '@/widgets/program-editor/use-complex-editing'

// Правки уходят на сервер по очереди; удаление упражнения и разборку суперсета можно отменить 3 секунды
const useComplexActions = (templateId: number, complexId: number, onDeleted: () => void) => {
  const queryClient = useQueryClient()
  const renameComplex = useRenameTemplateComplex()
  const deleteComplex = useDeleteTemplateComplex()
  const updateExercise = useUpdateTemplateExercise()
  const deleteExercise = useDeleteTemplateExercise()
  const reorderExercises = useReorderTemplateExercises()
  const ungroupExercise = useUngroupTemplateExercise()
  const ungroupSuperset = useUngroupTemplateSuperset()

  return useComplexEditing({
    mutations: {
      renameComplex: (id, name) => renameComplex.mutateAsync({ id, name }),
      deleteComplex: id => deleteComplex.mutateAsync(id),
      updateExercise: (id, plan) => updateExercise.mutateAsync({ id, ...plan }),
      deleteExercise: id => deleteExercise.mutateAsync(id),
      reorderExercises: (id, ids) => reorderExercises.mutateAsync({ complexId: id, ids }),
      ungroupExercise: id => ungroupExercise.mutateAsync(id),
      ungroupSuperset: (id, superset) => ungroupSuperset.mutateAsync({ complexId: id, superset }),
    },
    readComplex: () =>
      queryClient.getQueryData<Program>(adminTemplateKeys.detail(templateId))?.complexes.find(c => c.id === complexId),
    onDeleted,
  })
}

// Комплекс шаблона на отдельной странице — как у программ пользователя (frontend-tz, 14.2)
const TemplateComplexPage = () => {
  const params = useParams()
  const templateId = Number(params.templateId)
  const complexId = Number(params.complexId)
  const navigate = useNavigate()
  const template = useAdminTemplate(templateId)
  const back = buildPath(ROUTES.ADMIN_TEMPLATE, { templateId })
  const { view, actions } = useComplexActions(templateId, complexId, () => navigate(back, { replace: true }))
  const index = template.data?.complexes.findIndex(c => c.id === complexId) ?? -1
  const pick = (p: Program) => {
    const complex = p.complexes.find(c => c.id === complexId)
    return complex && view(complex)
  }

  return (
    <Screen
      header={
        <TopBar
          back={back}
          title={template.data?.complexes[index]?.name ?? 'Комплекс'}
          subtitle={index >= 0 ? `комплекс ${complexLetter(index)} · ${template.data?.name}` : undefined}
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
        isEmpty={p => !pick(p)}
        empty={{ title: 'Комплекса нет', description: 'Его уже удалили. Вернись в программу.' }}
      >
        {p => {
          const complex = pick(p)
          return (
            complex && (
              <ComplexEditor
                complex={complex}
                actions={actions(complex)}
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
