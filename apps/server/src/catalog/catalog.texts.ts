import { Equipment } from '@/generated/prisma/client';

import { ExerciseFull, StretchFull } from './catalog.service';

export const EQUIPMENT_TITLE: Record<Equipment, string> = {
  BARBELL: 'штанга',
  DUMBBELL: 'гантели',
  MACHINE: 'тренажёр',
  BODYWEIGHT: 'собственный вес',
};

const lower = (value: string) => value.toLowerCase();

/** «30 сек на сторону». */
export function holdText(stretch: {
  holdSeconds: number;
  perSide: boolean;
}): string {
  return `${stretch.holdSeconds} сек${stretch.perSide ? ' на сторону' : ''}`;
}

export function exerciseCard(exercise: ExerciseFull): string {
  const primary = exercise.muscles
    .filter((m) => m.role === 'PRIMARY')
    .map((m) => lower(m.muscle.name));
  const secondary = exercise.muscles
    .filter((m) => m.role === 'SECONDARY')
    .map((m) => lower(m.muscle.name));
  const lines = [
    `${exercise.name}${exercise.status === 'DRAFT' ? ' · не проверено' : ''}`,
    '',
  ];
  // «Собственный вес» — это отсутствие инвентаря: строку не показываем
  if (exercise.equipment && exercise.equipment !== 'BODYWEIGHT')
    lines.push(`Инвентарь: ${EQUIPMENT_TITLE[exercise.equipment]}`);
  lines.push(`Основные мышцы: ${primary.join(', ') || '—'}`);
  if (secondary.length) lines.push(`Вспомогательные: ${secondary.join(', ')}`);
  if (exercise.joints.length)
    lines.push(
      `Нагружает: ${exercise.joints.map((j) => lower(j.joint.name)).join(', ')}`,
    );
  lines.push('', exercise.technique?.trim() || 'Техника не описана.');
  return lines.join('\n');
}

export function stretchCard(stretch: StretchFull): string {
  return [
    `${stretch.name}${stretch.status === 'DRAFT' ? ' · не проверено' : ''}`,
    '',
    `Тянет: ${stretch.muscles.map((m) => lower(m.muscle.name)).join(', ') || '—'}`,
    `Удержание: ${holdText(stretch)}`,
    '',
    stretch.howTo?.trim() || 'Описание не добавлено.',
  ].join('\n');
}
