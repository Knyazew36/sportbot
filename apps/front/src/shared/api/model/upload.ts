import $api from './request'

// Generic multipart-загрузка файла — axios сам проставит multipart boundary для FormData,
// переиспользуемо для любых будущих сущностей (товары, документы), не только для аватара
export const uploadFile = (url: string, file: File, extra?: Record<string, string>) => {
  const formData = new FormData()
  formData.append('file', file)
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => formData.append(key, value))
  }
  return $api.post(url, formData)
}
