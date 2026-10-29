import { CircleCheck, Info, OctagonX, TriangleAlert } from 'lucide-react-native';
import { Toaster as SonnerToaster } from 'sonner-native';

import { useTheme } from '@/shared/theme/ThemeProvider';
import { fonts } from '@/shared/theme/fonts';

const ICON_SIZE = 16;

// Порт shared/ui/shadcn/toast.tsx фронта: карточка в стиле кнопок — рамка и жёсткая тень без скругления,
// у ошибки они красные, успех — мятная заливка. Сверху: снизу тост закрыли бы липкая кнопка и меню
export const Toaster = () => {
  const { colors } = useTheme();
  return (
    <SonnerToaster
      position="top-center"
      gap={12}
      icons={{
        success: <CircleCheck size={ICON_SIZE} color="#0a0a0a" />,
        error: <OctagonX size={ICON_SIZE} color={colors.danger} />,
        warning: <TriangleAlert size={ICON_SIZE} color={colors.ink} />,
        info: <Info size={ICON_SIZE} color={colors.ink} />,
      }}
      toastOptions={{
        style: {
          borderRadius: 0,
          borderWidth: 1.5,
          borderColor: colors.ink,
          backgroundColor: colors.paper,
          paddingVertical: 12,
          paddingHorizontal: 16,
          // Мягкая тень sonner по умолчанию заменена жёсткой, как у кнопок
          shadowOpacity: 0,
          elevation: 0,
          boxShadow: `4px 4px 0 ${colors.ink}`,
        },
        error: {
          borderColor: colors.danger,
          boxShadow: `4px 4px 0 ${colors.danger}`,
        },
        success: { backgroundColor: colors.live },
        toastContentStyle: { gap: 12, alignItems: 'center' },
        titleStyle: {
          fontFamily: fonts.sansMedium,
          fontWeight: undefined,
          fontSize: 15,
          lineHeight: 21,
          letterSpacing: -0.3,
          color: colors.ink,
        },
        descriptionStyle: {
          fontFamily: fonts.sans,
          fontSize: 14,
          lineHeight: 19,
          letterSpacing: -0.28,
          color: colors.slate,
        },
      }}
    />
  );
};
