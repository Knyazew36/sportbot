// Упражнение и комплекс в редакторе — порт widgets/program-editor/types.ts
export type EditorExercise = {
  id: number;
  name: string;
  muscles: string;
  sets: number;
  /** Диапазон повторов: «8–12» */
  reps: string;
  /** Личный черновик автора — «не проверено» */
  draft?: boolean;
};

export type EditorComplex = { id: number; letter: string; title: string; exercises: EditorExercise[] };
