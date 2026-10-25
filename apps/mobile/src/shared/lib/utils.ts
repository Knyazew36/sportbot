import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Склейка классов с разрешением конфликтов — как cn во фронте и в React Native Reusables
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Список по строкам из n элементов: сетка кнопок в RN — ряды с flex-1, CSS grid тут нет */
export const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
};
