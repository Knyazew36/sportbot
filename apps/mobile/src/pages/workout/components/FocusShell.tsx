import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/lib/utils';
import { useTheme } from '@/shared/theme/ThemeProvider';
import { Eyebrow, Poster } from '@/shared/ui/kit/Typography';
import { FocusScoreboard, type FocusSets } from './FocusScoreboard';

type FocusShellProps = {
  status?: string;
  alert?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  above?: ReactNode;
  running?: boolean;
  sets?: FocusSets;
  startedAt?: string;
  children: ReactNode;
  actions: ReactNode;
};

export const FocusShell = ({
  status,
  alert,
  title,
  subtitle,
  above,
  running,
  sets,
  startedAt,
  children,
  actions,
}: FocusShellProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View className="bg-background absolute inset-0 z-[45] flex flex-col">
      <View
        className={cn('pointer-events-none absolute inset-0 opacity-[0.06]', running && 'opacity-[0.1]')}
        style={{ backgroundColor: running ? colors.blue : colors.ink }}
      />
      <View className="relative flex-col gap-3 px-gutter" style={{ paddingTop: insets.top + 16 }}>
        {above}
        {(status || title || subtitle) && (
          <View>
            {status && (
              <Eyebrow tone={alert ? 'primary' : 'muted'} className="mb-1">
                {status}
              </Eyebrow>
            )}
            {title && (
              <Poster size="md" numberOfLines={2} className="text-balance">
                {title}
              </Poster>
            )}
            {subtitle}
          </View>
        )}
        {sets && startedAt && <FocusScoreboard sets={sets} startedAt={startedAt} />}
      </View>
      <View className="relative flex flex-1 flex-col items-center justify-center gap-6 px-gutter">{children}</View>
      <View className="relative flex flex-col gap-3 px-gutter" style={{ paddingBottom: Math.max(20, insets.bottom) }}>
        {actions}
      </View>
    </View>
  );
};
