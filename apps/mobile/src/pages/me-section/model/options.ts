export const REST_OPTIONS = [
  { value: '60', label: '1:00' },
  { value: '90', label: '1:30' },
  { value: '120', label: '2:00' },
  { value: '180', label: '3:00' },
];

export const WARMUP_OPTIONS = [
  { value: '0', label: 'Нет' },
  { value: '5', label: '5 мин' },
  { value: '10', label: '10 мин' },
  { value: '15', label: '15 мин' },
];

/** 150 → «2:30» */
export const restLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export const WEIGHT_ASK_OPTIONS = [
  { value: 'OFF', label: 'Не спрашивать' },
  { value: 'WEEKLY', label: 'Раз в неделю' },
  { value: 'BIWEEKLY', label: 'Раз в две недели' },
  { value: 'MONTHLY', label: 'Раз в месяц' },
];
