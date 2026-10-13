import { request } from './model/orval-mutator'

// Мутации на сервере — только POST, поэтому методов два
export const http = {
  get: <T>(url: string, params?: object) => request<T>({ url, method: 'GET', params }),

  post: <T>(url: string, data?: unknown) => request<T>({ url, method: 'POST', data }),

  /** multipart-загрузка одного файла в поле file; boundary axios проставит сам */
  upload: <T>(url: string, file: File, extra?: Record<string, string>) => {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(extra ?? {}).forEach(([key, value]) => formData.append(key, value))
    return request<T>({ url, method: 'POST', data: formData })
  },
}
