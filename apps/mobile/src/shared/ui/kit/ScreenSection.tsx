import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';

import { Rise } from './Reveal';
import { Eyebrow, Poster } from './Typography';

type ScreenSectionProps = {
  title?: ReactNode;
  /** Пояснение справа от заголовка: единицы, счётчик */
  aside?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** Контент на всю ширину экрана — для горизонтальных лент */
  bleed?: boolean;
  /**
   * label — лёгкая метка: секции экрана-плаката, где блоки и так разные по виду.
   * block — жирная линейка и плакатный заголовок: длинные экраны настроек и форм
   */
  variant?: 'label' | 'block';
  /** Порядковый номер блока — только для variant='block' */
  index?: number;
  className?: string;
};

type BlockHeadingProps = Pick<ScreenSectionProps, 'title' | 'aside' | 'action' | 'index'>;

// Плакатная шапка блока с номером
export const BlockHeading = ({ index, title, aside, action }: BlockHeadingProps) => (
  <View className="flex-row flex-wrap items-end justify-between gap-x-3 gap-y-1">
    <View className="min-w-0 shrink flex-row items-baseline gap-2.5">
      {index != null && (
        <Poster size="lg" tone="primary" numeric>
          {String(index).padStart(2, '0')}
        </Poster>
      )}
      <Poster size="lg" className="shrink">
        {title}
      </Poster>
    </View>
    {aside ? <Eyebrow className="pb-0.5 text-right">{aside}</Eyebrow> : null}
    {action}
  </View>
);

// Секция экрана — порт shared/ui/kit/ScreenSection.tsx. Заголовок label-секции во фронте скрыт —
// показываем только действие, как там
export const ScreenSection = ({
  title,
  aside,
  action,
  children,
  bleed,
  variant = 'label',
  index,
  className,
}: ScreenSectionProps) => {
  if (variant === 'block') {
    return (
      <Rise className={cn('px-gutter', className)}>
        <View className="border-foreground gap-4 border-t-[3px] pt-3">
          <BlockHeading index={index} title={title} aside={aside} action={action} />
          {children}
        </View>
      </Rise>
    );
  }

  return (
    <Rise className={cn('gap-3', !bleed && 'px-gutter', className)}>
      {action ? <View className={cn('flex-row justify-end', bleed && 'px-gutter')}>{action}</View> : null}
      {children}
    </Rise>
  );
};
