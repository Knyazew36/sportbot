// Совпадает с meta пагинированного списка на бэке (paginatePrisma)
export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface BaseResponse<T> {
  data: T
  timestamp: string
  status: string
  error?: { message: string; error: string; statusCode: number }
  path?: string
  user?: {
    id: number
    telegramId: string
    allowedPhone: boolean
    role: string | null
    phone: boolean
  }
}

export interface ErrorResponse {
  error: boolean
  message?: string
  code: number
}

export interface PaginationResponse<T> {
  data: {
    data: T[]
    pagination: Pagination
  }
  timestamp: string
  status: string
  error?: { message: string; error: string; statusCode: number }
  path?: string
  user?: {
    id: number
    telegramId: string
    allowedPhone: boolean
    role: string | null
  }
}
