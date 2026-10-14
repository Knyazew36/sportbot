import { useNavigate, useParams } from 'react-router'

import { useAddTemplateExercises, useAdminTemplate } from '@/entities/admin'
import { buildPath, ROUTES } from '@/shared/config/paths'
import { ExercisePicker } from '@/widgets/program-editor/ExercisePicker'

// Подбор упражнений в комплекс шаблона (frontend-tz, 14.2)
const TemplateAddExercisePage = () => {
  const params = useParams()
  const templateId = Number(params.templateId)
  const complexId = Number(params.complexId)
  const navigate = useNavigate()
  const template = useAdminTemplate(templateId)
  const add = useAddTemplateExercises()
  const back = buildPath(ROUTES.ADMIN_TEMPLATE_COMPLEX, { templateId, complexId })

  return (
    <ExercisePicker
      complex={template.data?.complexes.find(c => c.id === complexId)}
      back={back}
      adding={add.isPending}
      onAdd={exerciseIds =>
        add.mutate({ complexId, exerciseIds }, { onSuccess: () => navigate(back, { replace: true }) })
      }
    />
  )
}

export default TemplateAddExercisePage
