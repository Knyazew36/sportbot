import { useState } from 'react';
import { View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { normalizeTagName, type ProgramTagGroup } from '@sportbot/api/entities/program';

import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { Icon } from '@/shared/ui/kit/Icon';
import { Input } from '@/shared/ui/kit/Input';
import { Text } from '@/shared/ui/kit/Typography';
import { Pressable } from '@/shared/ui/kit/Pressable';

/** Вариант в списке: тег справочника, свой тег автора или новый, ещё без id */
type TagOption = { key: string; id: number | null; name: string; pending: boolean };

type TagChipsFieldProps = {
  group: ProgramTagGroup;
  /** Выбранные теги группы: справочник и свои уже стоящие */
  tagIds: number[];
  /** Новые свои теги группы, добавленные в этой форме */
  newNames: string[];
  /** Сколько своих тегов ещё можно добавить на программу */
  ownLeft: number;
  invalid?: boolean;
  onChange: (next: { tagIds: number[]; newNames: string[] }) => void;
};

const NAME_MIN = 2;
const NAME_MAX = 24;

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

// Теги группы одним полем — порт features/publish-program/TagChipsField.tsx. Комбобокса в RN нет: выбранные — чипами
// над полем, невыбранные и «Создать» — чипами под ним. Свой тег — по «Готово» или запятой; пробел не разделяет —
// теги бывают из нескольких слов («Верх тела»). Совпавший с существующим тег не создаётся: «зал» выберет «Зал»
export const TagChipsField = ({ group, tagIds, newNames, ownLeft, invalid, onChange }: TagChipsFieldProps) => {
  // Текст поиска в поле, а не значение формы: в форму попадают только выбранные чипы
  const [query, setQuery] = useState('');

  const known: TagOption[] = group.tags.map((t) => ({ key: `t${t.id}`, id: t.id, name: t.name, pending: !t.isApproved }));
  const added: TagOption[] = newNames.map((name) => ({ key: `n:${name}`, id: null, name, pending: true }));
  const value = [...known.filter((o) => tagIds.includes(o.id!)), ...added];
  const chosen = new Set(value.map((o) => o.key));

  const typed = cleanName(query);
  const same = typed ? [...known, ...added].find((o) => normalizeTagName(o.name) === normalizeTagName(typed)) : undefined;
  const creatable = !same && typed.length >= NAME_MIN && typed.length <= NAME_MAX && ownLeft > 0;
  const needle = normalizeTagName(typed);
  const suggestions = known.filter((o) => !chosen.has(o.key) && (!needle || normalizeTagName(o.name).includes(needle)));

  const commit = (next: TagOption[]) => {
    onChange({
      tagIds: next.filter((o) => o.id != null).map((o) => o.id!),
      newNames: next.filter((o) => o.id == null).map((o) => o.name),
    });
    setQuery('');
  };

  // «Готово» на клавиатуре и запятая: выбрать совпавший тег или создать свой
  const commitTyped = () => {
    if (same) commit(chosen.has(same.key) ? value : [...value, same]);
    else if (creatable) commit([...value, { key: `n:${typed}`, id: null, name: typed, pending: true }]);
  };

  const hint =
    typed.length > NAME_MAX
      ? `Тег — до ${NAME_MAX} символов`
      : ownLeft <= 0 && typed && !same
        ? 'Своих тегов уже максимум'
        : typed && !suggestions.length && !creatable && !same
          ? 'Ничего не нашлось'
          : null;

  return (
    <View className="gap-2">
      {value.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5">
          {value.map((o) => (
            <Chip
              key={o.key}
              label={o.name}
              pending={o.pending}
              selected
              onPress={() => commit(value.filter((v) => v.key !== o.key))}
            />
          ))}
        </View>
      )}
      <Input
        value={query}
        onChangeText={(text) => {
          if (!text.includes(',')) return setQuery(text);
          // Запятая — как «Готово»: текст до неё становится тегом
          setQuery(text.replace(/,/g, ''));
          commitTyped();
        }}
        onSubmitEditing={commitTyped}
        submitBehavior="submit"
        returnKeyType="done"
        placeholder={value.length ? 'Ещё тег' : 'Выбери или впиши свой'}
        accessibilityLabel={group.name}
        invalid={invalid}
        autoCorrect={false}
      />
      {(suggestions.length > 0 || creatable) && (
        <View className="flex-row flex-wrap gap-1.5">
          {suggestions.map((o) => (
            <Chip
              key={o.key}
              label={o.pending ? `${o.name} · на проверке` : o.name}
              pending={o.pending}
              onPress={() => commit([...value, o])}
            />
          ))}
          {creatable && <Chip label={`Создать «${typed}» — на проверку`} pending create onPress={commitTyped} />}
        </View>
      )}
      {hint ? (
        <Text size="xs" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

type ChipProps = { label: string; pending?: boolean; selected?: boolean; create?: boolean; onPress: () => void };

// Пунктир — свой тег: попадёт в справочник после проверки. Выбранный залит и снимается крестиком
const Chip = ({ label, pending, selected, create, onPress }: ChipProps) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={selected ? `Убрать «${label}»` : label}
    onPress={() => {
      haptic.tap();
      onPress();
    }}
    className={cn(
      'h-8 flex-row items-center gap-1 border-[1.5px] px-2.5',
      selected ? 'border-primary bg-accent' : 'border-foreground/40 bg-background active:bg-mist',
      pending && 'border-dashed',
    )}
  >
    {create && <Icon as={Plus} className="text-primary size-3.5" />}
    <Text size="sm" tone={selected || create ? 'primary' : 'inherit'} numberOfLines={1}>
      {label}
    </Text>
    {selected && <Icon as={X} className="text-primary size-3.5" />}
  </Pressable>
);
