import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { pluralize } from '@front-cmdt/utils/pluralize';

import { complexLetter, type ProgramComplex } from '@sportbot/api/entities/program';

import { EXERCISE_FORMS } from '@/shared/lib/plural-forms';
import { GUTTER } from '@/shared/theme/tokens';
import { ScreenSection } from '@/shared/ui/kit/ScreenSection';
import { Ticket } from '@/shared/ui/kit/Ticket';
import { Eyebrow } from '@/shared/ui/kit/Typography';

import { ComplexSheet } from './ComplexSheet';

type ComplexQueueProps = {
  complexes: ProgramComplex[];
  /** Какой билет подсвечен: следующий по очереди или выбранный на сегодня */
  activeId: number | undefined;
  aside?: string;
  /** Выбор комплекса из шторки; без него шторка только показывает состав */
  onPick?: (id: number) => void;
  pickLabel?: string;
  /** Своё действие в шторке комплекса вместо выбора */
  action?: (complex: ProgramComplex, close: () => void) => ReactNode;
  /** Последний билет ленты, например «Добавить тренировку» */
  trailing?: ReactNode;
};

// Билет шириной 152 + зазор 8 — шаг ленты для прокрутки к активному
const TICKET_STEP = 160;

// Очередь комплексов программы билетами — порт widgets/complex-queue/ComplexQueue.tsx.
// Билет открывает состав комплекса в шторке
export const ComplexQueue = ({
  complexes,
  activeId,
  aside,
  onPick,
  pickLabel,
  action,
  trailing,
}: ComplexQueueProps) => {
  const [opened, setOpened] = useState<{ complex: ProgramComplex; index: number } | null>(null);
  const listRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);

  // Активный билет может уехать за край ленты — прокручиваем к нему только ленту
  const activeIndex = complexes.findIndex((c) => c.id === activeId);
  useEffect(() => {
    if (activeIndex < 0 || !width) return;
    const x = GUTTER + activeIndex * TICKET_STEP - (width - 152) / 2;
    listRef.current?.scrollTo({ x: Math.max(x, 0), animated: true });
  }, [activeIndex, width]);

  return (
    <ScreenSection title="Очередь тренировок" aside={aside} bleed>
      <ScrollView
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        contentContainerClassName="px-gutter gap-2"
      >
        {complexes.map((c, i) => (
          <Ticket
            key={c.id}
            kicker="Тренировка"
            mark={complexLetter(i)}
            title={c.name}
            active={c.id === activeId}
            onPress={() => setOpened({ complex: c, index: i })}
          >
            <Eyebrow>{pluralize(c.exercises.length, EXERCISE_FORMS)}</Eyebrow>
          </Ticket>
        ))}
        {trailing ? <View className="self-start">{trailing}</View> : null}
      </ScrollView>
      <ComplexSheet
        complex={opened}
        onClose={() => setOpened(null)}
        activeId={activeId}
        onPick={onPick}
        pickLabel={pickLabel}
        action={action}
      />
    </ScreenSection>
  );
};
