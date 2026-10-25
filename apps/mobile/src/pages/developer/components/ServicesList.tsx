import { List, ListRow } from '@/shared/ui/kit/ListRow';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { SERVICES } from '../model/developer';

export const ServicesList = () => (
  <ScreenSection>
    {/* Заголовок label-секции в kit скрыт — здесь он нужен, поэтому меткой */}
    <Eyebrow>Что можем сделать</Eyebrow>
    <List>
      {SERVICES.map(({ title, text }, i) => (
        <ListRow key={title} lead={String(i + 1).padStart(2, '0')} title={title} meta={text} />
      ))}
    </List>
  </ScreenSection>
);
