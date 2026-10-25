import { router, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program';

import { Button } from '@/shared/ui/kit/Button';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Sortable } from '@/shared/ui/kit/Sortable';
import { Text } from '@/shared/ui/kit/Typography';

import { ProgramComplexRow } from './ProgramComplexRow';

/** Что список умеет делать с комплексами: программы пользователя и шаблоны админа */
export type ComplexListActions = {
  /** Возвращает комплексы после добавления: в новый сразу переходим собирать упражнения */
  addComplex: (name: string) => Promise<{ complexes: { id: number }[] }>;
  reorderComplexes: (ids: number[]) => void;
};

type ProgramComplexListProps = {
  complexes: ProgramComplex[];
  actions: ComplexListActions;
  /** Экран комплекса: название и упражнения */
  complexTo: (complexId: number) => string;
  /** Пока сохраняется добавление — кнопка неактивна */
  adding?: boolean;
  /** Номер блока на экране редактора */
  index?: number;
};

// Тренировки программы в порядке очереди — порт widgets/program-editor/ProgramComplexList.tsx:
// перетаскивание за ручку и добавление. Состав комплекса правится на его экране — здесь только очередь
export const ProgramComplexList = ({ complexes, actions, complexTo, adding, index }: ProgramComplexListProps) => {
  const drop = (keys: React.Key[]) => {
    const ids = keys.map(Number);
    if (ids.some((id, i) => id !== complexes[i]?.id)) actions.reorderComplexes(ids);
  };

  const addComplex = () =>
    actions
      .addComplex(`Тренировка ${complexLetter(complexes.length)}`)
      .then((program) => {
        const created = program.complexes.at(-1);
        if (created) router.push(complexTo(created.id) as Href);
      })
      // Ошибку уже показал общий тост
      .catch(() => undefined);

  return (
    <ScreenSection
      variant="block"
      index={index}
      title="Тренировки"
      aside={complexes.length > 1 ? 'идут по очереди · тяни за ручку' : undefined}
    >
      {complexes.length === 0 && (
        <Text size="sm" tone="muted">
          Тренировка — набор упражнений на один день. Бот выдаёт их по очереди: A, B, C — и снова A
        </Text>
      )}
      {complexes.length > 0 && (
        <Sortable
          gap={8}
          items={complexes}
          keyOf={(c) => c.id}
          onReorder={drop}
          renderItem={(c, handle, i) => <ProgramComplexRow complex={c} index={i} to={complexTo(c.id)} handle={handle} />}
        />
      )}
      <Button
        variant={complexes.length ? 'outline' : 'default'}
        block
        icon={Plus}
        disabled={adding}
        onPress={() => void addComplex()}
      >
        {complexes.length ? 'Добавить тренировку' : 'Добавить первую тренировку'}
      </Button>
    </ScreenSection>
  );
};
