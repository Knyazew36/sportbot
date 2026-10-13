// Типы зеркалят контракт сервера: ResponseInterceptor, AllExceptionsFilter, paginatePrisma

/** Date в DTO сервера приходит по JSON строкой ISO */
export type ISODateString = string

/** Успешный ответ: всё, что вернул контроллер, лежит в data */
export interface ApiSuccess<T> {
  status: 'success'
  data: T
  timestamp: ISODateString
}

/** Тело ошибки. message — массив, когда не прошла валидация DTO (class-validator) */
export interface ApiErrorBody {
  message: string | string[]
  status: number
  timestamp: ISODateString
  path: string
  /** Машинный код варианта ошибки, если сервер его передал (new ConflictException({ message, code })) */
  code?: string
  /** Стек — только при NODE_ENV=development на сервере */
  exception?: string
}

export interface PaginationMeta {
  total?: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/** data пагинированного списка (@Swagger({ isArray: true })) */
export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

/** PaginationQueryDto сервера */
export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
  search?: string
}

export interface SelectOption<V extends string | number = string> {
  label: string
  value: V
}
