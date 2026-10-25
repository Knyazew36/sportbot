import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Склейка классов с разрешением конфликтов — как cn во фронте и в React Native Reusables
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
