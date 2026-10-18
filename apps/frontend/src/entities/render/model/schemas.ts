import { type CompositionId, type CompositionProps, COMPOSITIONS } from '@sportbot/render-contract'

// Схемы props роликов живут в общем контракте: по ним же сервер проверяет заказ, а Studio строит
// панель props. Здесь — только доступ для форм приложения
// Тип возврата — явно: без него TS сливает схемы всех роликов в объединение, и форма не типизируется
export const renderPropsSchema = <Id extends CompositionId>(id: Id): (typeof COMPOSITIONS)[Id]['schema'] =>
  COMPOSITIONS[id].schema

export type RenderPropsValues<Id extends CompositionId> = CompositionProps<Id>
