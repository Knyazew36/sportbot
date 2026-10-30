import { Info, List, RefreshCw, SkipBack, SkipForward } from 'lucide-react-native';

import { timerEndSignal } from '@/shared/lib/signal';
import { Button } from '@/shared/ui/kit/Button';
import { Icon } from '@/shared/ui/kit/Icon';
import { Screen } from '@/shared/ui/kit/Screen';
import { TopBar } from '@/shared/ui/kit/ScreenHeader';
import { HoldControls } from '@/widgets/catalog/HoldControls';
import { StretchProgress } from '@/widgets/stretch-run/StretchProgress';
import { StretchStepBody } from '@/widgets/stretch-run/StretchStepBody';

import type { CooldownFlow } from '../model/use-cooldown-flow';
import { CooldownAddSheet, CooldownDetailSheet, CooldownListSheet } from './CooldownSheets';

type CooldownStepProps = {
  flow: CooldownFlow;
  index: number;
  side: 1 | 2;
};

// Одна растяжка: фото позы, шаги и таймер удержания. Следующую человек открывает сам
export const CooldownStep = ({ flow, index, side }: CooldownStepProps) => {
  const { cooldown, all } = flow;
  const stretch = all[index];
  // Растяжку убрали без замены, номер шага поправится следующим рендером
  if (!stretch) return null;
  const inMain = index < cooldown.main.length;
  const isLast =
    (index === all.length - 1 || (inMain && index === cooldown.main.length - 1)) && (!stretch.perSide || side === 2);
  const key = `${index}-${stretch.id}-${side}`;

  return (
    <Screen
      key={`screen-${key}`}
      fullscreen
      header={
        <>
          <TopBar
            back={flow.finish}
            title="Заминка"
            subtitle={`${index + 1} из ${all.length} · ещё ~${flow.remainingMinutes} мин`}
            action={
              <Button variant="alert" size="icon" accessibilityLabel="Весь список" onPress={() => flow.setListOpen(true)}>
                <Icon as={List} className="size-5" />
              </Button>
            }
          />
          <StretchProgress ids={all.map((s) => s.id)} current={index} done={flow.done} mainCount={cooldown.main.length} />
        </>
      }
      footer={
        // Ключи соседей разные: одинаковые сломали бы сверку React и старый таймер остался бы рядом с новым
        <HoldControls
          key={`hold-${key}`}
          holdSeconds={stretch.holdSeconds}
          // Вторая сторона: поза уже понятна, читать нечего — отсчёт сразу
          autoStart={side === 2}
          back={{ label: 'Назад', icon: SkipBack, onPress: flow.prev, disabled: index === 0 && side === 1 }}
          next={{
            label: stretch.perSide && side === 1 ? 'Левая' : isLast ? 'Готово' : 'Дальше',
            icon: SkipForward,
            onPress: flow.next,
          }}
          // Без автоперехода: следующую растяжку человек открывает сам, когда прочитал и готов
          onEnd={() => timerEndSignal(cooldown)}
        />
      }
      className="gap-5 px-gutter pt-4"
    >
      <StretchStepBody
        stretch={stretch}
        side={side}
        eyebrow={inMain ? stretch.muscles : `Если есть время · ${stretch.muscles}`}
        actions={
          <>
            {/* Не подходит сейчас — ставим другую на те же мышцы, в исключения она не попадает */}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              disabled={flow.swapPending}
              onPress={() => flow.swapStretch(stretch.id)}
            >
              Другая
            </Button>
            {/* Шторка поверх: таймер удержания под ней продолжает идти */}
            <Button variant="outline" size="sm" icon={Info} onPress={() => flow.open(stretch)}>
              Подробнее
            </Button>
          </>
        }
      />
      <CooldownListSheet flow={flow} />
      <CooldownDetailSheet flow={flow} />
      <CooldownAddSheet flow={flow} />
    </Screen>
  );
};
