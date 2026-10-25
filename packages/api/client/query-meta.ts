// Модуль, а не глобальный скрипт: иначе declare module заменил бы типы react-query, а не дополнил
export {}

// Единые договорённости о тостах (CLAUDE.md, «Запросы»): хуки не пишут onError/onSuccess ради уведомлений
declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: {
      /** Данные переживают закрытие приложения: экран открывается и без сети */
      persist?: boolean
    }
    mutationMeta: {
      /** Мутация из офлайн-очереди: переживает закрытие приложения и доезжает, когда появится сеть */
      persist?: boolean
      /** Текст тоста об успехе. Без него и без skipSuccessToast покажется общий «Готово» */
      successMessage?: string
      /** Успех и так виден на экране — тост не нужен. Рядом с флагом — комментарий почему */
      skipSuccessToast?: boolean
      /** 422 с ошибками полей показывается под инпутами формы, тост не дублируется */
      inlineFieldErrors?: boolean
    }
  }
}
