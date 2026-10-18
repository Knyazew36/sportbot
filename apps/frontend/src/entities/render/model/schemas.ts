import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'

// Схемы props роликов живут в общем контракте: по ним же сервер проверяет заказ, а Studio строит
// панель props. Здесь — только доступ для форм приложения
export const renderPropsSchema = <Id extends CompositionId>(id: Id) => COMPOSITIONS[id].schema

export type RenderPropsValues<Id extends CompositionId> = CompositionProps<Id>
