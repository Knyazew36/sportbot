import { View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  OWN_TAGS_MAX,
  type Program,
  type ProgramTagGroup,
  publishProgramSchema,
  type PublishProgramValues,
  useAllTagGroups,
  usePublishProgram,
} from '@sportbot/api/entities/program';

import { applyFieldErrors } from '@/shared/lib/form';
import { Button } from '@/shared/ui/kit/Button';
import { ErrorText } from '@/shared/ui/kit/ErrorText';
import { Input } from '@/shared/ui/kit/Input';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Sheet } from '@/shared/ui/kit/Sheet';
import { Text } from '@/shared/ui/kit/Typography';

import { TagChipsField } from './TagChipsField';

type PublishSheetProps = {
  program: Program;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PublishFormProps = {
  program: Program;
  groups: ProgramTagGroup[];
  onDone: () => void;
};

const PublishForm = ({ program, groups, onDone }: PublishFormProps) => {
  const publish = usePublishProgram();
  // Свои теги автора, ещё не одобренные, встают в поле своей группы рядом с тегами справочника
  const pending = program.tags.filter((t) => !t.isApproved);
  const rows = groups.map((g) => ({ ...g, tags: [...g.tags, ...pending.filter((t) => t.groupId === g.id)] }));
  const schema = publishProgramSchema(rows.map((g) => ({ id: g.id, name: g.name, tagIds: g.tags.map((t) => t.id) })));

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<PublishProgramValues>({
    resolver: zodResolver(schema),
    defaultValues: { description: program.description ?? '', tagIds: program.tags.map((t) => t.id), newTags: [] },
  });
  const [tagIds, newTags] = useWatch({ control, name: ['tagIds', 'newTags'] });
  const pendingIds = new Set(pending.map((t) => t.id));
  const ownLeft = OWN_TAGS_MAX - tagIds.filter((id) => pendingIds.has(id)).length - newTags.length;

  const submit = handleSubmit((values) =>
    publish
      .mutateAsync({ id: program.id, ...values })
      .then(onDone)
      .catch((error) => applyFieldErrors(error, setError)),
  );

  return (
    <View className="gap-5 pb-2">
      <View className="gap-2">
        <Text size="sm" tone="soft">
          Описание
        </Text>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Input
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Для кого программа, сколько раз в неделю и что нужно из инвентаря"
              accessibilityLabel="Описание"
              maxLength={1000}
              multiline
              textAlignVertical="top"
              invalid={!!errors.description}
              className="h-auto min-h-24 py-2.5"
            />
          )}
        />
        <ErrorText errors={errors.description} />
      </View>

      {rows.map((g) => {
        const own = new Set(g.tags.map((t) => t.id));
        return (
          <View key={g.id} className="gap-2">
            <Text size="sm" tone="soft">
              {g.name}
            </Text>
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => (
                // Каждая группа правит только свои теги и свои новые, остальные остаются как были
                <TagChipsField
                  group={g}
                  tagIds={field.value.filter((id) => own.has(id))}
                  newNames={newTags.filter((t) => t.groupId === g.id).map((t) => t.name)}
                  ownLeft={ownLeft}
                  invalid={!!errors.tagIds}
                  onChange={(next) => {
                    field.onChange([...field.value.filter((id) => !own.has(id)), ...next.tagIds]);
                    setValue(
                      'newTags',
                      [
                        ...newTags.filter((t) => t.groupId !== g.id),
                        ...next.newNames.map((name) => ({ groupId: g.id, name })),
                      ],
                      { shouldValidate: isSubmitted },
                    );
                  }}
                />
              )}
            />
          </View>
        );
      })}
      <ErrorText errors={[errors.tagIds, errors.newTags]} />
      <Text size="sm" tone="muted">
        Нет нужного тега — впиши свой и нажми «Готово» или запятую. Своих тегов — до {OWN_TAGS_MAX}, они с пунктиром: их
        проверит администратор и может заменить на похожий из списка.
      </Text>

      <Button variant="share" block loading={publish.isPending} onPress={() => void submit()}>
        {program.publication === 'PUBLISHED' ? 'Сохранить' : 'Отправить на проверку'}
      </Button>
    </View>
  );
};

// Форма публикации поверх обычной программы — порт features/publish-program/PublishSheet.tsx:
// создание остаётся коротким, описание и теги нужны только каталогу
export const PublishSheet = ({ program, open, onOpenChange }: PublishSheetProps) => {
  const groups = useAllTagGroups();
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={program.publication === 'PUBLISHED' ? 'Публикация' : 'Опубликовать в каталог'}
      description={
        program.publication === 'PUBLISHED'
          ? 'Теги меняются сразу. Новое название или описание появится в каталоге после проверки.'
          : 'Программу увидят все в «Программах пользователей» и смогут взять себе. Сначала её проверит администратор.'
      }
    >
      {open && (
        <QueryState query={groups}>
          {(list) => <PublishForm program={program} groups={list} onDone={() => onOpenChange(false)} />}
        </QueryState>
      )}
    </Sheet>
  );
};
