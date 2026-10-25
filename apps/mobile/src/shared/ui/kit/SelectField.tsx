import { SheetSelectField } from './SheetSelectField';

type Option = { value: string; label: string };

type SelectFieldProps = {
  options: readonly Option[];
  value: string;
  onValueChange: (value: string) => void;
  /** Подпись для скринридера и заголовок шторки выбора */
  ariaLabel?: string;
  className?: string;
};

// Выбор из списка одной строкой — порт shared/ui/kit/SelectField.tsx: упражнение для графика, частота вопроса.
// Выпадающего списка в RN нет, поэтому варианты открываются той же шторкой, что у SheetSelectField
export const SelectField = ({ options, value, onValueChange, ariaLabel, className }: SelectFieldProps) => (
  <SheetSelectField
    options={options}
    value={value}
    onValueChange={onValueChange}
    title={ariaLabel ?? 'Выбрать'}
    className={className}
  />
);
