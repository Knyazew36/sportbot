import { View } from 'react-native';

import type { CatalogRef } from '@sportbot/api/entities/catalog';
import { Button } from '@/shared/ui/kit/Button';
import { Grid } from '@/shared/ui/kit/Grid';
import { Eyebrow, Text } from '@/shared/ui/kit/Typography';

type MuscleRolesProps = {
  muscles: CatalogRef[];
  primary: number[];
  secondary: number[];
  onChange: (next: { primary: number[]; secondary: number[] }) => void;
};

const ROLE_LABEL = { PRIMARY: 'основная', SECONDARY: 'помогает' } as const;

// Роль мышцы одним нажатием по кругу — порт widgets/catalog/MuscleRoles.tsx: нет → основная → помогает → нет.
// Два отдельных списка по 16 мышц заняли бы два экрана
export const MuscleRoles = ({ muscles, primary, secondary, onChange }: MuscleRolesProps) => {
  const cycle = (id: number) => {
    if (primary.includes(id)) onChange({ primary: primary.filter((x) => x !== id), secondary: [...secondary, id] });
    else if (secondary.includes(id)) onChange({ primary, secondary: secondary.filter((x) => x !== id) });
    else onChange({ primary: [...primary, id], secondary });
  };

  return (
    <Grid items={muscles} columns={2} keyOf={(m) => m.id}>
      {(m) => {
        const role = primary.includes(m.id) ? 'PRIMARY' : secondary.includes(m.id) ? 'SECONDARY' : null;
        return (
          <Button
            variant={role === 'PRIMARY' ? 'default' : role === 'SECONDARY' ? 'alert' : 'outline'}
            size="sm"
            block
            accessibilityLabel={`${m.name}: ${role ? ROLE_LABEL[role] : 'не участвует'}`}
            onPress={() => cycle(m.id)}
            // Роль — второй строкой: в одну строку с ней длинное название мышцы обрезалось
            contentClassName="min-h-11 flex-col items-start justify-center gap-0 px-3 py-1.5"
          >
            <View>
              <Text size="sm" medium numberOfLines={1} className={role ? undefined : 'text-foreground/60'}>
                {m.name}
              </Text>
              {role && (
                <Eyebrow size="sm" tone="inherit">
                  {ROLE_LABEL[role]}
                </Eyebrow>
              )}
            </View>
          </Button>
        );
      }}
    </Grid>
  );
};
