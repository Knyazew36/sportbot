import { Equipment, Prisma } from '@/generated/prisma/client';

import type { CatalogKind, ExerciseFull, StretchFull } from './catalog.service';
import { EQUIPMENT_TITLE } from './catalog.texts';

/** Поля формы упражнения, которые пользователь может предложить поменять. */
export type ExerciseForm = {
  name: string;
  technique: string | null;
  steps: string[];
  mistakes: string[];
  videoUrl: string | null;
  equipment: Equipment | null;
  imagePath: string | null;
  primary: number[];
  secondary: number[];
  jointIds: number[];
};

/** Поля формы растяжки. Тип «заминка / разминка» правкой не меняется — это решение админа. */
export type StretchForm = {
  name: string;
  howTo: string | null;
  steps: string[];
  mistakes: string[];
  imagePath: string | null;
  holdSeconds: number;
  perSide: boolean;
  muscles: number[];
};

/** Правка хранится в Complaint.proposal: только изменённые поля. */
export type ExerciseProposal = Partial<ExerciseForm>;
export type StretchProposal = Partial<StretchForm>;
export type CatalogProposal = ExerciseProposal | StretchProposal;

export type ProposalField = keyof ExerciseForm | keyof StretchForm;

export type ProposalChange = {
  field: ProposalField;
  title: string;
  before: string | null;
  after: string | null;
};

type ValueKind =
  | 'text'
  | 'list'
  | 'image'
  | 'equipment'
  | 'muscles'
  | 'joints'
  | 'seconds'
  | 'flag';

type FieldSpec = { title: string; kind: ValueKind };

// Порядок полей — как в форме приложения: так «было → стало» читается сверху вниз
const EXERCISE_FIELDS: Record<keyof ExerciseForm, FieldSpec> = {
  name: { title: 'Название', kind: 'text' },
  imagePath: { title: 'Картинка', kind: 'image' },
  equipment: { title: 'Инвентарь', kind: 'equipment' },
  primary: { title: 'Основные мышцы', kind: 'muscles' },
  secondary: { title: 'Помогают', kind: 'muscles' },
  jointIds: { title: 'Суставы', kind: 'joints' },
  technique: { title: 'Описание', kind: 'text' },
  steps: { title: 'Шаги', kind: 'list' },
  mistakes: { title: 'Ошибки', kind: 'list' },
  videoUrl: { title: 'Видео', kind: 'text' },
};

const STRETCH_FIELDS: Record<keyof StretchForm, FieldSpec> = {
  name: { title: 'Название', kind: 'text' },
  imagePath: { title: 'Картинка', kind: 'image' },
  muscles: { title: 'Мышцы', kind: 'muscles' },
  holdSeconds: { title: 'Удержание', kind: 'seconds' },
  perSide: { title: 'На каждую сторону', kind: 'flag' },
  howTo: { title: 'Описание', kind: 'text' },
  steps: { title: 'Шаги', kind: 'list' },
  mistakes: { title: 'Ошибки', kind: 'list' },
};

const specOf = (kind: CatalogKind): Record<string, FieldSpec> =>
  kind === 'exercise' ? EXERCISE_FIELDS : STRETCH_FIELDS;

// Пустая строка в форме и null в базе — одно и то же «нет значения».
// У шагов и ошибок порядок важен, у мышц и суставов — нет
const normalize = (spec: FieldSpec, value: unknown): unknown =>
  Array.isArray(value)
    ? spec.kind === 'list'
      ? JSON.stringify(value)
      : [...(value as number[])].sort((a, b) => a - b).join(',')
    : value === '' || value === undefined
      ? null
      : value;

export const exerciseForm = (exercise: ExerciseFull): ExerciseForm => ({
  name: exercise.name,
  technique: exercise.technique,
  steps: exercise.steps,
  mistakes: exercise.mistakes,
  videoUrl: exercise.videoUrl,
  equipment: exercise.equipment,
  imagePath: exercise.imagePath,
  primary: exercise.muscles
    .filter((m) => m.role === 'PRIMARY')
    .map((m) => m.muscleId),
  secondary: exercise.muscles
    .filter((m) => m.role === 'SECONDARY')
    .map((m) => m.muscleId),
  jointIds: exercise.joints.map((j) => j.jointId),
});

export const stretchForm = (stretch: StretchFull): StretchForm => ({
  name: stretch.name,
  howTo: stretch.howTo,
  steps: stretch.steps,
  mistakes: stretch.mistakes,
  imagePath: stretch.imagePath,
  holdSeconds: stretch.holdSeconds,
  perSide: stretch.perSide,
  muscles: stretch.muscles.map((m) => m.muscleId),
});

/** Оставляет только поля, которые правка действительно меняет. */
export const proposalDiff = <T extends object>(
  kind: CatalogKind,
  current: T,
  proposal: Partial<T>,
): Partial<T> => {
  const diff: Partial<T> = {};
  const now = current as Record<string, unknown>;
  const next = proposal as Record<string, unknown>;
  for (const [field, spec] of Object.entries(specOf(kind))) {
    const value = next[field];
    if (value === undefined) continue;
    if (normalize(spec, now[field]) !== normalize(spec, value))
      Object.assign(diff, { [field]: value === '' ? null : value });
  }
  return diff;
};

/** Правка из JSON-колонки: то, что туда положил proposalDiff. */
export const readProposal = (
  value: Prisma.JsonValue | null,
): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : null;

/** «Было → стало» для админа: названия мышц, суставов и инвентаря вместо id. */
export const proposalChanges = (
  kind: CatalogKind,
  current: object,
  proposal: object,
  names: { muscles: Map<number, string>; joints: Map<number, string> },
): ProposalChange[] => {
  const now = current as Record<string, unknown>;
  const next = proposal as Record<string, unknown>;
  const text = (spec: FieldSpec, value: unknown): string | null => {
    if (value === null || value === undefined || value === '') return null;
    switch (spec.kind) {
      case 'equipment':
        return EQUIPMENT_TITLE[value as Equipment];
      case 'seconds':
        return `${value as number} с`;
      case 'flag':
        return value ? 'да' : 'нет';
      case 'list': {
        const items = value as string[];
        return items.length
          ? items.map((item, i) => `${i + 1}. ${item}`).join('\n')
          : null;
      }
      case 'muscles':
      case 'joints': {
        const map = spec.kind === 'joints' ? names.joints : names.muscles;
        const list = (value as number[]).map((id) => map.get(id) ?? `#${id}`);
        return list.length ? list.join(', ') : null;
      }
      default:
        return typeof value === 'string' ? value : null;
    }
  };
  return Object.entries(specOf(kind))
    .filter(([field]) => next[field] !== undefined)
    .map(([field, spec]) => ({
      field: field as ProposalField,
      title: spec.title,
      before: text(spec, now[field]),
      after: text(spec, next[field]),
    }));
};
