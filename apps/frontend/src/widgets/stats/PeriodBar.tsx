import { Segmented } from '@/shared/ui/kit/Segmented'

import { PERIODS, usePeriod } from './periods'

// Один переключатель периода на экран: прогресс, посещаемость и вес тела меняются вместе
export const PeriodBar = () => {
  const [period, setPeriod] = usePeriod()

  return (
    <div className='px-gutter'>
      <Segmented
        options={PERIODS}
        value={period}
        onValueChange={setPeriod}
        stretch
      />
    </div>
  )
}
