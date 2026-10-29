import { toast as sonnerToast } from 'sonner-native';

// Успех — мятная заливка, текст на ней чёрный и в тёмной теме (text-black во фронте).
// У Toaster стиль текста один на все варианты, поэтому цвет ставится каждому тосту успеха здесь
const SUCCESS_STYLES = {
  title: { color: '#0a0a0a' },
  description: { color: 'rgba(10, 10, 10, 0.7)' },
};

type ToastData = Parameters<typeof sonnerToast.success>[1];

const success = (message: string, data?: ToastData) =>
  sonnerToast.success(message, {
    ...data,
    styles: {
      ...data?.styles,
      title: { ...SUCCESS_STYLES.title, ...data?.styles?.title },
      description: { ...SUCCESS_STYLES.description, ...data?.styles?.description },
    },
  });

/** toast из sonner-native с цветами успеха как во фронте; импортировать отсюда, а не из sonner-native */
export const toast = Object.assign((message: string, data?: ToastData) => sonnerToast(message, data), sonnerToast, {
  success,
});
