import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/kit/Badge';
import { CatalogImage } from '@/shared/ui/kit/CatalogImage';
import { ListRow } from '@/shared/ui/kit/ListRow';

type CatalogRowProps = {
  name: string;
  imageUrl: string | null;
  meta: ReactNode;
  /** Личный черновик — «не проверено» (frontend-tz, 11.1) */
  draft?: boolean;
  /** Тап по строке: открыть карточку или показать запись в шторке */
  onPress?: () => void;
  trail?: ReactNode;
  /** Выбранная строка в множественном выборе */
  selected?: boolean;
  children?: ReactNode;
};

// Строка справочника — порт widgets/catalog/CatalogRow.tsx: миниатюра, название, мышцы.
// Общая для справочника, подбора в комплекс и замены. Кнопка справа нажимается отдельно от строки
export const CatalogRow = ({ name, imageUrl, meta, draft, onPress, trail, selected, children }: CatalogRowProps) => (
  <ListRow
    lead={<CatalogImage src={imageUrl} alt="" />}
    title={name}
    meta={meta}
    trail={trail}
    onPress={onPress}
    className={cn('-mx-gutter px-gutter', selected && 'bg-accent')}
  >
    {draft ? (
      <Badge variant="outline" className="mt-2">
        не проверено
      </Badge>
    ) : null}
    {children}
  </ListRow>
);
