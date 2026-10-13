import { useSearchParams } from 'react-router'

// Номер страницы списка живёт в адресе (?page=2): ссылку можно переслать, «назад» возвращает прошлую страницу
export const usePageParam = (): [number, (page: number) => void] => {
  const [params, setParams] = useSearchParams()
  const parsed = Number(params.get('page'))
  const page = Number.isInteger(parsed) && parsed > 0 ? parsed : 1

  const setPage = (next: number) =>
    setParams(prev => {
      const nextParams = new URLSearchParams(prev)
      if (next <= 1) nextParams.delete('page')
      else nextParams.set('page', String(next))
      return nextParams
    })

  return [page, setPage]
}
