import { useState } from 'react';
import { Check, Plus } from 'lucide-react-native';

import { EQUIPMENT_LABEL } from '@sportbot/api/entities/catalog';
import type { SupersetTarget } from '@sportbot/api/entities/program';
import { toAssetUrl } from '@/shared/api';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Screen, StickyFooter } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { CatalogBrowser } from '@/widgets/catalog/CatalogBrowser';
import { type CatalogFilterState, EMPTY_CATALOG_FILTER } from '@/widgets/catalog/catalog-filter';
import { CatalogRow } from '@/widgets/catalog/CatalogRow';
import { type CreatedExercise, ExerciseCreateSheet } from '@/widgets/catalog/ExerciseCreateSheet';
import { ExerciseSheet } from '@/widgets/exercise-sheet/ExerciseSheet';

type ExercisePickerProps = {
  /** Упражнения, которые уже стоят там, куда добавляем: помечены, но их можно добавить ещё раз */
  presentIds: number[];
  /** Куда добавляем — подпись под заголовком */
  subtitle?: string;
  /** Назад — туда, куда добавляем. По умолчанию системный назад */
  back?: () => void;
  /** Добавить в суперсет: к упражнению комплекса или новым суперсетом (тогда выбрать хотя бы два) */
  target?: SupersetTarget;
  adding: boolean;
  onAdd: (exerciseIds: number[]) => void;
};

// Подбор упражнений в комплекс программы или в тренировку (frontend-tz, 10.3) — порт
// widgets/program-editor/ExercisePicker.tsx. Тот же блок справочника, что в «Библиотеке».
// Отдельный экран, а не шторка: список длинный, клавиатура съедает половину экрана.
// Во фронте поиск и выбор живут в адресе, чтобы «назад» из создания их не сбрасывал;
// здесь создание — шторка поверх, экран не уходит, поэтому хватает состояния
export const ExercisePicker = ({ presentIds, subtitle, back, target, adding, onAdd }: ExercisePickerProps) => {
  const [filter, setFilter] = useState<CatalogFilterState>(EMPTY_CATALOG_FILTER);
  const [picked, setPicked] = useState<number[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [preview, setPreview] = useState<{ id: number; name: string } | null>(null);

  const present = new Set(presentIds);
  const minPicked = target?.newSuperset ? 2 : 1;
  const toggle = (id: number) => setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Нужного нет в справочнике — создаём своё и сразу добавляем вместе с уже выбранными
  const addCreated = (created: CreatedExercise) => onAdd([...new Set([...picked, created.id])]);

  return (
    <Screen
      fullscreen
      header={
        <TopBar
          back={back}
          title="Добавить упражнение"
          subtitle={subtitle}
          action={
            <Button size="sm" icon={Plus} onPress={() => setCreateOpen(true)}>
              Новое
            </Button>
          }
        />
      }
      footer={
        // Пока печатаем в поиске, футер прячем: клавиатура и так съедает пол-экрана
        !typing && (
          <StickyFooter>
            <Button size="lg" block loading={adding} disabled={picked.length < minPicked} onPress={() => onAdd(picked)}>
              {picked.length === 0
                ? 'Выбери упражнения'
                : picked.length < minPicked
                  ? 'Для суперсета нужно хотя бы два'
                  : `Добавить · ${picked.length}`}
            </Button>
          </StickyFooter>
        )
      }
      className="gap-5 pt-4"
    >
      <CatalogBrowser
        kind="exercise"
        filter={filter}
        onFilterChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        onSearchFocusChange={setTyping}
        emptyAction={
          <Button variant="outline" icon={Plus} onPress={() => setCreateOpen(true)}>
            Добавить своё
          </Button>
        }
        renderItem={(e) => {
          const on = picked.includes(e.id);
          return (
            <CatalogRow
              key={e.id}
              name={e.name}
              imageUrl={toAssetUrl(e.imageUrl) ?? null}
              meta={[e.muscles, e.equipment && EQUIPMENT_LABEL[e.equipment], present.has(e.id) && 'уже в тренировке']
                .filter(Boolean)
                .join(' · ')}
              draft={e.draft}
              onPress={() => setPreview(e)}
              selected={on}
              trail={
                <Button
                  variant={on ? 'default' : 'outline'}
                  size="icon-sm"
                  accessibilityLabel={on ? `Убрать «${e.name}»` : `Выбрать «${e.name}»`}
                  onPress={() => toggle(e.id)}
                >
                  <Icon as={on ? Check : Plus} strokeWidth={on ? 3 : 2.5} className="size-4" />
                </Button>
              }
            />
          );
        }}
      />

      <ExerciseSheet
        exercise={preview}
        onOpenChange={(open) => !open && setPreview(null)}
        action={
          preview && (
            <Button
              size="lg"
              block
              variant={picked.includes(preview.id) ? 'outline' : 'default'}
              onPress={() => {
                toggle(preview.id);
                setPreview(null);
              }}
            >
              {picked.includes(preview.id) ? 'Убрать из выбора' : present.has(preview.id) ? 'Выбрать ещё раз' : 'Выбрать'}
            </Button>
          )
        }
      />

      <ExerciseCreateSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={addCreated} />
    </Screen>
  );
};
