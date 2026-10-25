import { type Equipment, EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';

/** Инвентарь простыми словами: где и с чем делать */
const EQUIPMENT_HINT: Record<Equipment, string> = {
  BARBELL: 'гриф с блинами, в зале',
  DUMBBELL: 'можно и дома, если есть гантели',
  MACHINE: 'тренажёры и блоки в зале',
  BODYWEIGHT: 'без снарядов, где угодно',
};

export const EQUIPMENT_OPTIONS: { value: Equipment | 'ALL'; meta: string }[] = [
  { value: 'ALL', meta: 'показать всё' },
  ...(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((value) => ({ value, meta: EQUIPMENT_HINT[value] })),
];
