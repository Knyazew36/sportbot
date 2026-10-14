import { useEffect, useState } from 'react'

/** Значение, которое догоняет исходное после паузы: поиск не шлёт запрос на каждую букву */
export const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
