import { useEffect, useState } from 'react';

import { formatSeconds } from '@/shared/lib/hooks/use-deadline-timer';

/** Прошедшее время тренировки в шапке: обновляется каждую секунду */
export const ElapsedInline = ({ startedAt }: { startedAt: string }) => {
  const [seconds, setSeconds] = useState(() => Math.floor((Date.now() - Date.parse(startedAt)) / 1000));

  useEffect(() => {
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - Date.parse(startedAt)) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <>{formatSeconds(seconds)}</>;
};
