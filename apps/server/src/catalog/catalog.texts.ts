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

/** Шаги и ошибки записи — строками для сообщений бота; пустые списки не выводятся. */
export function guideLines(entry: {
  steps: string[];
  mistakes: string[];
}): string[] {
  return [
    ...(entry.steps.length
      ? ['', 'Шаги:', ...entry.steps.map((step, i) => `${i + 1}. ${step}`)]
      : []),
    ...(entry.mistakes.length
      ? ['', '❌ Ошибки:', ...entry.mistakes.map((m) => `• ${m}`)]
      : []),
  ];
}

/** Строку «Ошибки: …» в тексте техники выносим отдельным абзацем с пометкой. */
function techniqueText(technique: string): string {
  return technique
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (/^ошибки:/i.test(line) ? `\n❌ ${line}` : line))
    .join('\n');
}

export function exerciseCard(exercise: ExerciseFull): string {
  const primary = exercise.muscles
    .filter((m) => m.role === 'PRIMARY')
    .map((m) => lower(m.muscle.name));
  const secondary = exercise.muscles
    .filter((m) => m.role === 'SECONDARY')
    .map((m) => lower(m.muscle.name));
  const technique = exercise.technique?.trim();
  const lines = [
    `🏋️ ${exercise.name}${exercise.status === 'DRAFT' ? ' · не проверено' : ''}`,
    '',
  ];
  // «Собственный вес» — это отсутствие инвентаря: строку не показываем
  if (exercise.equipment && exercise.equipment !== 'BODYWEIGHT')
    lines.push(`🛠 Инвентарь: ${EQUIPMENT_TITLE[exercise.equipment]}`);
  lines.push(`💪 Основные мышцы: ${primary.join(', ') || '—'}`);
  if (secondary.length)
    lines.push(`🤝 Вспомогательные: ${secondary.join(', ')}`);
  if (exercise.joints.length)
    lines.push(
      `🦴 Нагружает: ${exercise.joints.map((j) => lower(j.joint.name)).join(', ')}`,
    );
  const guide = guideLines(exercise);
  lines.push(
    '',
    technique
      ? `📋 ${techniqueText(technique)}`
      : guide.length
        ? '📋 Техника'
        : 'Техника не описана.',
    ...guide,
  );
  return lines.join('\n');
}

export function stretchCard(stretch: StretchFull): string {
  const howTo = stretch.howTo?.trim();
  return [
    `🧘 ${stretch.name}${stretch.status === 'DRAFT' ? ' · не проверено' : ''}`,
    '',
    `💪 Тянет: ${stretch.muscles.map((m) => lower(m.muscle.name)).join(', ') || '—'}`,
    `⏱ Удержание: ${holdText(stretch)}`,
    '',
    howTo
      ? `📋 ${howTo}`
      : stretch.steps.length || stretch.mistakes.length
        ? '📋 Как делать'
        : 'Описание не добавлено.',
    ...guideLines(stretch),
  ].join('\n');
}
