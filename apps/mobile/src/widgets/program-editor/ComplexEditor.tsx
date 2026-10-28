import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link2, Plus, Trash2 } from 'lucide-react-native';

import { type ComplexExerciseValues, complexNameSchema, type ComplexNameValues, type ProgramComplex, toBlocks, withSupersetTarget } from '@sportbot/api/entities/program';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ButtonLink } from '@/shared/ui/kit/ButtonLink';
import { ConfirmAction } from '@/shared/ui/kit/ConfirmAction';
import { Rise } from '@/shared/ui/kit/Reveal';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Segmented } from '@/shared/ui/kit/Segmented';
import { Sortable } from '@/shared/ui/kit/Sortable';
import { TextField } from '@/shared/ui/kit/TextField';
import { Text } from '@/shared/ui/kit/Typography';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

import { ComplexExerciseRow } from './ComplexExerciseRow';
import { SupersetBlock } from './SupersetBlock';

/** Что экран комплекса умеет с ним делать: программы пользователя и шаблоны админа */
export type ComplexActions = {
  renameComplex: (id: number, name: string) => Promise<unknown>;
  /** null — как в профиле, 0 — без разминки */
  setWarmup: (id: number, warmupMinutes: number | null) => Promise<unknown>;
  /** После удаления экран уводит обратно в программу */
  deleteComplex: (id: number) => Promise<unknown>;
  updateExercise: (id: number, plan: ComplexExerciseValues) => Promise<unknown>;
  deleteExercise: (id: number) => void;
  reorderExercises: (complexId: number, ids: number[]) => void;
  ungroupExercise: (id: number) => void;
  ungroupSuperset: (complexId: number, superset: number) => void;
};

type ComplexEditorProps = {
  complex: ProgramComplex;
  actions: ComplexActions;
  /** Экран подбора упражнений в этот комплекс */
  addExerciseTo: string;
};

type ComplexNameFormProps = { complex: ProgramComplex; onRename: ComplexActions['renameComplex'] };

const ComplexNameForm = ({ complex, onRename }: ComplexNameFormProps) => {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ComplexNameValues>({
    resolver: zodResolver(complexNameSchema),
    values: { name: complex.name },
  });

  const save = handleSubmit(({ name }) => {
    if (name === complex.name) return;
    return onRename(complex.id, name).catch((error) => applyFieldErrors(error, setError));
  });

  return (
    <Controller
      control={control}
      name="name"
      render={({ field }) => (
        <TextField
          label="Название тренировки"
          placeholder="Например, «Ноги» или «Верх»"
          error={errors.name}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={() => {
            field.onBlur();
            void save();
          }}
          onSubmitEditing={() => void save()}
          returnKeyType="done"
        />
      )}
    />
  );
};

// «Профиль», а не «Как в профиле»: пять сегментов на 375px длинную подпись не вмещают
const WARMUP = [
  { value: '0', label: 'Нет' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' },
];

type ComplexWarmupProps = { complex: ProgramComplex; onChange: ComplexActions['setWarmup'] };

const ComplexWarmup = ({ complex, onChange }: ComplexWarmupProps) => (
  <View className="gap-2">
    <Text size="sm" tone="soft">
      Разминка, мин
    </Text>
    <Segmented
      options={WARMUP}
      // null (как в профиле) выбором больше не задаётся: с «Профилем» сегменты не влезали в ширину
      value={complex.warmupMinutes === null ? '' : String(complex.warmupMinutes)}
      onValueChange={(v) => void onChange(complex.id, Number(v))}
      stretch
    />
  </View>
);

// Комплекс целиком — порт widgets/program-editor/ComplexEditor.tsx: название, упражнения с планом,
// добавление и удаление. Каждая правка сразу уходит на сервер
export const ComplexEditor = ({ complex, actions, addExerciseTo }: ComplexEditorProps) => {
  // Упражнение, открытое в шторке: посмотреть технику, не уходя из редактора
  const [opened, setOpened] = useState<{ id: number; name: string } | null>(null);
  const blocks = toBlocks(complex.exercises);
  const ids = complex.exercises.map((e) => e.id);

  const save = (next: number[]) => {
    if (next.some((id, i) => id !== ids[i])) actions.reorderExercises(complex.id, next);
  };

  // Суперсет тянется целиком, поэтому двигаем блоки, а серверу отдаём плоский список
  const dropBlocks = (keys: React.Key[]) => {
    const at = new Map(keys.map((key, i) => [key, i]));
    const sorted = [...blocks].sort((a, b) => (at.get(a.key) ?? 0) - (at.get(b.key) ?? 0));
    save(sorted.flatMap((b) => b.items.map((e) => e.id)));
  };

  // Новый порядок внутри суперсета встаёт на место его участников
  const reorderInside = (blockKey: string, inside: number[]) =>
    save(blocks.flatMap((b) => (b.key === blockKey ? inside : b.items.map((e) => e.id))));

  return (
    <>
      <Rise className="px-gutter">
        <ComplexNameForm complex={complex} onRename={actions.renameComplex} />
      </Rise>

      <Rise className="px-gutter">
        <ComplexWarmup complex={complex} onChange={actions.setWarmup} />
      </Rise>

      <ScreenSection title="Упражнения" aside={ids.length > 1 ? 'порядок — тяни за ручку' : undefined}>
        {ids.length ? (
          <Sortable
            className="border-border border-t-[1.5px]"
            items={blocks}
            keyOf={(b) => b.key}
            onReorder={dropBlocks}
            renderItem={(block, handle) => {
              const { superset } = block;
              if (superset !== null)
                return (
                  <SupersetBlock
                    block={{ ...block, superset }}
                    handle={handle}
                    onReorder={(inside) => reorderInside(block.key, inside)}
                    onPlanChange={actions.updateExercise}
                    onRemove={actions.deleteExercise}
                    onUngroupExercise={actions.ungroupExercise}
                    onUngroup={() => actions.ungroupSuperset(complex.id, superset)}
                    addTo={withSupersetTarget(addExerciseTo, { joinItemId: block.items[0]!.id })}
                  />
                );
              const e = block.items[0]!;
              return (
                <ComplexExerciseRow
                  exercise={e}
                  handle={handle}
                  onPlanChange={(plan) => actions.updateExercise(e.id, plan)}
                  onRemove={() => actions.deleteExercise(e.id)}
                  onView={() => setOpened({ id: e.exerciseId, name: e.name })}
                  supersetTo={withSupersetTarget(addExerciseTo, { joinItemId: e.id })}
                />
              );
            }}
          />
        ) : (
          <Text size="sm" tone="muted">
            Пока пусто. Добавь упражнения — у каждого задашь подходы и повторы, например 3 × 8–12.
          </Text>
        )}
        <View className="flex-row gap-2">
          <ButtonLink
            href={addExerciseTo}
            variant={ids.length ? 'outline' : 'default'}
            icon={Plus}
            className="flex-1"
          >
            Упражнения
          </ButtonLink>
          <ButtonLink
            href={withSupersetTarget(addExerciseTo, { newSuperset: true })}
            variant="outline"
            icon={Link2}
            className="shrink-0"
          >
            Суперсет
          </ButtonLink>
        </View>
      </ScreenSection>

      <Rise className="px-gutter">
        <ConfirmAction
          trigger={<Button variant="destructive" block icon={Trash2} />}
          title={`Удалить «${complex.name}»?`}
          description="Тренировка пропадёт из очереди. История по ней сохранится."
          confirmLabel="Удалить"
          onConfirm={() => actions.deleteComplex(complex.id)}
        >
          Удалить тренировку
        </ConfirmAction>
      </Rise>

      <ExerciseSheet exercise={opened} onOpenChange={(open) => !open && setOpened(null)} />
    </>
  );
};
