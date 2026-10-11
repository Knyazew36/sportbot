import type { AxiosRequestConfig } from 'axios'

import { apiDomain } from './constants'
import $api from './request'
import type { BaseResponse } from './type'

// Контроллеры на бэке всегда заворачивают ответ в ResponseInterceptor (BaseResponse<T>).
// Новые контроллеры (через @Swagger()) описывают в OpenAPI-схеме честную обёртку BaseResponse<T>,
// поэтому сгенерированный orval-тип уже сам содержит `data`/`status`/`timestamp` — из него достаточно
// достать `data`. Старые контроллеры с "голой" схемой (без @Swagger()) описывают сразу T —
// для них сгенерированный тип совпадает с телом BaseResponse.data, доставать нечего, T и есть искомое.
// UnwrapData сама решает по форме типа, что делать. Проверяем именно тройку data+status+timestamp,
// а не просто `data` — у бизнес-DTO (например UserDto.data — сырой профиль Telegram) тоже есть
// поле `data`, и проверка по одному полю приняла бы такой DTO за обёртку.
type UnwrapData<T> = T extends { data?: infer D; status?: unknown; timestamp?: unknown } ? D : T

export const customInstance = <T>(config: AxiosRequestConfig): Promise<UnwrapData<T>> => {
  return $api({ ...config, baseURL: apiDomain }).then(res => (res.data as BaseResponse<UnwrapData<T>>).data)
}

// Для бинарных ручек (файловые скачивания): такие эндпоинты не заворачивают ответ в BaseResponse
// (ResponseInterceptor для них не применим — тело не JSON), поэтому обычный customInstance,
// который лезет в res.data.data, тут вернёт мусор. Нужен responseType: 'blob' и сырой AxiosResponse,
// чтобы вызывающий код мог достать и Blob, и заголовок Content-Disposition (имя файла).
export const customInstanceBlob = <T = Blob>(config: AxiosRequestConfig) => {
  return $api<T>({ ...config, baseURL: apiDomain, responseType: 'blob' })
}

export default customInstance
