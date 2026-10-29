import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, isValid, parse } from 'date-fns';
import { CalendarDays, Clock } from 'lucide-react-native';

import { formatDate } from '@/shared/lib/format';
import { haptic } from '@/shared/lib/haptics';
import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';

import { Button } from './Button';
import { ErrorText } from './ErrorText';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Text } from './Typography';

type Mode = 'date' | 'time';

// Значение поля — строка в формате схем пакета api (DATE / TIME в profile/model/schemas.ts)
const PATTERN: Record<Mode, string> = { date: 'yyyy-MM-dd', time: 'HH:mm' };

const toDate = (value: string, mode: Mode) => {
  const date = value ? parse(value, PATTERN[mode], new Date()) : new Date();
  return isValid(date) ? date : new Date();
};

type DateTimeFieldProps = {
  mode: Mode;
  /** «2026-10-26» для даты, «08:30» для времени; пустая строка — не выбрано */
  value: string;
  onChange: (value: string) => void;
  /** Подпись над полем и заголовок шторки на iOS */
  label: string;
  /** Подпись уже есть рядом (срок паузы) — над полем не дублируем */
  hideLabel?: boolean;
  /** Ошибка поля из react-hook-form: formState.errors.<name> */
  error?: { message?: string };
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
};

// Дата или время — замена input type=date/time фронта. На Android системный диалог открывается сам,
// на iOS колесо/календарь в шторке с «Готово»: инлайн-пикер iOS занимает пол-экрана и мешал бы форме
export const DateTimeField = ({
  mode,
  value,
  onChange,
  label,
  hideLabel,
  error,
  placeholder = 'Выбрать',
  minimumDate,
  maximumDate,
}: DateTimeFieldProps) => {
  const { colors, scheme } = useTheme();
  const [open, setOpen] = useState(false);
  // На iOS колесо крутится без сохранения — значение уходит в форму только по «Готово»
  const [draft, setDraft] = useState(() => toDate(value, mode));

  const shown = value ? (mode === 'date' ? formatDate(value, 'd MMMM yyyy') : value) : null;

  const pick = () => {
    haptic.tap();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: toDate(value, mode),
        mode,
        is24Hour: true,
        minimumDate,
        maximumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(format(date, PATTERN[mode]));
        },
      });
      return;
    }
    setDraft(toDate(value, mode));
    setOpen(true);
  };

  return (
    <View className="gap-1.5">
      {!hideLabel && (
        <Text size="sm" tone="soft">
          {label}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={pick}
        className={cn(
          'bg-background h-12 w-full flex-row items-center justify-between gap-2 border-[1.5px] px-3.5',
          error ? 'border-destructive' : open ? 'border-primary' : 'border-input',
        )}
      >
        <Text size="lg" tone={shown ? 'inherit' : 'muted'} numberOfLines={1} className="min-w-0 flex-1">
          {shown ?? placeholder}
        </Text>
        <Icon as={mode === 'date' ? CalendarDays : Clock} className="text-muted-foreground size-4 shrink-0" />
      </Pressable>
      <ErrorText errors={error} />

      {Platform.OS === 'ios' && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          title={label}
          footer={
            <Button
              block
              onPress={() => {
                onChange(format(draft, PATTERN[mode]));
                setOpen(false);
              }}
            >
              Готово
            </Button>
          }
        >
          <View className="items-center">
            <DateTimePicker
              value={draft}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant={scheme}
              accentColor={colors.blue}
              textColor={colors.ink}
              onChange={(_event: DateTimePickerEvent, date?: Date) => date && setDraft(date)}
            />
          </View>
        </Sheet>
      )}
    </View>
  );
};
