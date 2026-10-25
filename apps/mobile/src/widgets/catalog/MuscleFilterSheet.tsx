import { useState } from 'react';
import { View } from 'react-native';

import { MUSCLE_GROUPS, muscleGroupOf } from '@sportbot/api/entities/catalog';
import { cn } from '@/shared/lib/utils';
import { BodyMap } from '@/shared/ui/kit/BodyMap';
import { Button } from '@/shared/ui/kit/Button';
import { Grid } from '@/shared/ui/kit/Grid';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

type Muscle = { code: string; name: string };

type MuscleFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Мышцы справочника: code и название */
  muscles: readonly Muscle[];
  /** Выбранные мышцы — коды */
  value: readonly string[];
  onApply: (codes: string[]) => void;
  /** Подпись кнопки по черновику выбора: «Показать 42 упражнения» */
  showLabel?: (codes: string[]) => string;
};

type DraftProps = Omit<MuscleFilterSheetProps, 'open' | 'onOpenChange'>;

// Черновик выбора: копится здесь и применяется кнопкой, список под шторкой не мигает
const useMuscleDraft = (value: readonly string[]) => {
  const [codes, setCodes] = useState<string[]>([...value]);
  const [focus, setFocus] = useState<string | undefined>(value[0] ? muscleGroupOf(value[0])?.label : undefined);

  const toggle = (code: string) => {
    setCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
    setFocus(muscleGroupOf(code)?.label);
  };

  // Группа целиком: не все выбраны — выбрать все, все — снять
  const toggleGroup = (label: string) => {
    const group = MUSCLE_GROUPS.find((g) => g.label === label);
    if (!group) return;
    const all = group.codes.every((c) => codes.includes(c));
    setCodes((prev) => (all ? prev.filter((c) => !group.codes.includes(c)) : [...new Set([...prev, ...group.codes])]));
    setFocus(label);
  };

  // Мышцы по отдельности — у каждой группы, где что-то выбрано, и у последней нажатой.
  // Только у последней — список пропадал, стоило нажать группу из одной мышцы («Пресс»)
  const expanded = MUSCLE_GROUPS.filter(
    (g) => g.codes.length > 1 && (g.label === focus || g.codes.some((c) => codes.includes(c))),
  );

  return { codes, focus, expanded, toggle, toggleGroup };
};

const Draft = ({ muscles, value, onApply, showLabel = () => 'Показать' }: DraftProps) => {
  const { codes, focus, expanded, toggle, toggleGroup } = useMuscleDraft(value);
  const names = Object.fromEntries(muscles.map((m) => [m.code, m.name]));

  return (
    <View className="gap-4 pt-1">
      {/* Спереди и сзади рядом: крутить тело не нужно, по крупным фигурам легко попасть */}
      <View className="flex-row gap-3">
        {(['front', 'back'] as const).map((side) => (
          <View key={side} className="flex-1 items-center gap-1">
            <BodyMap side={side} selected={codes} onToggle={toggle} className="w-full" />
            <Text size="xs" tone="muted">
              {side === 'front' ? 'спереди' : 'сзади'}
            </Text>
          </View>
        ))}
      </View>

      <Grid items={MUSCLE_GROUPS} columns={3} keyOf={(g) => g.label}>
        {(g) => {
          const picked = g.codes.filter((c) => codes.includes(c)).length;
          const all = picked === g.codes.length;
          return (
            <Button
              variant={all ? 'default' : 'outline'}
              size="sm"
              block
              contentClassName={cn(
                'min-h-11 px-2',
                focus === g.label && !all && 'border-primary',
                picked > 0 && !all && 'bg-sb-tint',
              )}
              onPress={() => toggleGroup(g.label)}
            >
              {g.label}
            </Button>
          );
        }}
      </Grid>

      {expanded.map((group) => (
        <View key={group.label} className="gap-2">
          <Eyebrow>{group.label} — по отдельности</Eyebrow>
          <Grid items={group.codes} columns={2} keyOf={(code) => code}>
            {(code) => (
              <Button
                variant={codes.includes(code) ? 'default' : 'outline'}
                size="sm"
                block
                contentClassName="min-h-11 justify-start px-3"
                onPress={() => toggle(code)}
              >
                {names[code] ?? code}
              </Button>
            )}
          </Grid>
        </View>
      ))}

      {!focus && (
        <Text size="sm" tone="muted">
          Нажми на мышцу на теле или выбери группу.
        </Text>
      )}

      <View className="flex-row gap-2 pt-2">
        {codes.length > 0 && (
          // Сброс сразу применяется и закрывает шторку — «Показать» после него лишний шаг
          <Button variant="outline" onPress={() => onApply([])}>
            Сбросить
          </Button>
        )}
        <Button block className="flex-1" onPress={() => onApply(codes)}>
          {showLabel(codes)}
        </Button>
      </View>
    </View>
  );
};

// Фильтр по мышцам — порт widgets/catalog/MuscleFilterSheet.tsx: для тех, кто не знает названий —
// тап по телу или по группе, под группой мышцы по отдельности
export const MuscleFilterSheet = ({ open, onOpenChange, muscles, value, onApply, showLabel }: MuscleFilterSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange} title="Какие мышцы?">
    {/* Новый черновик на каждое открытие: закрыли без «Показать» — выбор не меняется */}
    {open && (
      <Draft
        muscles={muscles}
        value={value}
        showLabel={showLabel}
        onApply={(codes) => {
          onApply(codes);
          onOpenChange(false);
        }}
      />
    )}
  </Sheet>
);
