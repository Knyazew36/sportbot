import { applyDecorators } from '@nestjs/common'
import { ApiForbiddenResponse, ApiProperty, ApiExtraModels } from '@nestjs/swagger'

export class PlanForbiddenResponseDto {
  @ApiProperty({ description: 'Текст для пользователя — с названием тарифа и цифрой лимита' })
  message: string

  @ApiProperty({
    description: 'Машиночитаемая причина отказа: лимит тарифа исчерпан или фича недоступна на тарифе',
    enum: ['PLAN_LIMIT_EXCEEDED', 'PLAN_FEATURE_UNAVAILABLE'],
    example: 'PLAN_LIMIT_EXCEEDED'
  })
  code: 'PLAN_LIMIT_EXCEEDED' | 'PLAN_FEATURE_UNAVAILABLE'

  @ApiProperty({ required: false, description: 'Какой лимит исчерпан (только для PLAN_LIMIT_EXCEEDED)' })
  limitKey?: string

  @ApiProperty({ required: false, description: 'Значение лимита на текущем тарифе' })
  limit?: number

  @ApiProperty({ required: false, description: 'Сколько уже использовано' })
  used?: number

  @ApiProperty({ required: false, description: 'Какая фича недоступна (только для PLAN_FEATURE_UNAVAILABLE)' })
  featureKey?: string
}

/** 403 от PlanLimitGuard/RequiresFeatureGuard/PlanLimitService — вешать на все гейченные тарифом точки. */
export function ApiPlanForbidden() {
  return applyDecorators(
    ApiExtraModels(PlanForbiddenResponseDto),
    ApiForbiddenResponse({ type: PlanForbiddenResponseDto, description: 'Ограничение тарифа' })
  )
}
