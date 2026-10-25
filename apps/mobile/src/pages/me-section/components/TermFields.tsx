import { DateTimeField } from '@/shared/ui/kit/DateTimeField';
import { Segmented } from '@/shared/ui/kit/Segmented';

export type Term = 'date' | 'forever';

type TermFieldsProps = {
  term: Term;
  onTermChange: (term: Term) => void;
  /** Дата окончания из формы: «2026-11-30» или пустая строка */
  endDate: string;
  onEndDateChange: (endDate: string) => void;
  error?: { message?: string };
  dateLabel: string;
};

// Срок «до даты» / «до отмены» — общий для паузы и ограничения по суставу. Дата не раньше сегодняшней
export const TermFields = ({ term, onTermChange, endDate, onEndDateChange, error, dateLabel }: TermFieldsProps) => (
  <>
    <Segmented
      options={[
        { value: 'date', label: 'До даты' },
        { value: 'forever', label: 'До отмены' },
      ]}
      value={term}
      onValueChange={onTermChange}
      stretch
    />
    {term === 'date' && (
      <DateTimeField
        mode="date"
        value={endDate}
        onChange={onEndDateChange}
        label={dateLabel}
        hideLabel
        error={error}
        minimumDate={new Date()}
      />
    )}
  </>
);
