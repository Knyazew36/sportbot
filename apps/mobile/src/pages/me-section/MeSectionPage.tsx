import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { useProfile } from '@sportbot/api/entities/profile';

import { findMeSection } from '@/shared/config/me-sections';
import { ROUTES } from '@/shared/config/routes';
import { QueryState } from '@/shared/ui/kit/QueryState';
import { Rise } from '@/shared/ui/kit/Reveal';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { BlockHeading } from '@/shared/ui/kit/ScreenSection';

import { SECTION_ITEMS } from './sections';

// Экран раздела профиля — порт pages/me-section: «Назад» в меню и все пункты раздела подряд
const MeSectionPage = () => {
  const { section: slug } = useLocalSearchParams<{ section: string }>();
  const section = findMeSection(slug);
  const items = section ? SECTION_ITEMS[section.slug] : [];
  const profile = useProfile();

  // Старая или выдуманная ссылка — в меню профиля, а не на пустой экран
  if (!section) return <Redirect href={ROUTES.ME} />;

  // Пункт один — его шапку заменяет заголовок экрана
  const numbered = items.length > 1;

  return (
    <Screen header={<TopBar title={section.title} />} className="gap-12">
      <QueryState query={profile}>
        {(p) =>
          items.map((item, i) => (
            <View key={item.title} className="gap-4">
              {numbered && (
                <Rise className="px-gutter">
                  <View className="border-foreground border-t-[3px] pt-3">
                    <BlockHeading index={i + 1} title={item.title} />
                  </View>
                </Rise>
              )}
              {item.render(p)}
            </View>
          ))
        }
      </QueryState>
    </Screen>
  );
};

export default MeSectionPage;
