import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Кастомные размеры шрифта и радиусы из global.css: без регистрации tailwind-merge принимает
// text-body-sm за цвет и выкидывает text-primary-foreground — кнопка становится чёрной на чёрном
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['caption', 'body-sm', 'body', 'subheading', 'subheading-lg', 'heading-sm', 'heading', 'heading-lg', 'display', 'display-xl'],
      radius: ['card', 'pill', 'arc'],
    },
  },
})

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
