import type { AxiosRequestConfig } from 'axios'

import $api from './request'
import type { ApiSuccess } from './type'

// Сервер заворачивает любой JSON-ответ в ApiSuccess<T> (ResponseInterceptor). Эндпоинты с response в @Swagger()
// описывают в OpenAPI честную обёртку — сгенерированный orval-тип содержит data/status/timestamp, из него нужно
// достать data. Эндпоинты без response описаны «голой» схемой — там T уже и есть содержимое data.
// Проверяем наличие ключей status и timestamp, а не одного data: поле data бывает и у бизнес-DTO.
export type UnwrapData<T> = 'status' extends keyof T
  ? 'timestamp' extends keyof T
    ? T extends { data?: infer D }
      ? D
      : T
    : T
  : T

/** Запрос с уже развёрнутым ответом: T — то, что вернул контроллер */
export const request = <T>(config: AxiosRequestConfig): Promise<T> =>
  $api<ApiSuccess<T>>(config).then(res => res.data.data)

/** Мутатор для orval: T — сгенерированный тип ответа (с обёрткой или без) */
export const customInstance = <T>(config: AxiosRequestConfig): Promise<UnwrapData<T>> => request<UnwrapData<T>>(config)

// Бинарные ручки (@Swagger({ binary: true })) отдают сырой файл без обёртки. Возвращаем AxiosResponse целиком:
// вызывающему коду нужен и Blob, и заголовок Content-Disposition с именем файла
export const customInstanceBlob = <T = Blob>(config: AxiosRequestConfig) => $api<T>({ ...config, responseType: 'blob' })

export default customInstance
