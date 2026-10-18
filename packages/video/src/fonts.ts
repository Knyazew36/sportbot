import '@fontsource-variable/onest'
import '@fontsource-variable/oswald'
import { continueRender, delayRender } from 'remotion'

// Fontsource грузит шрифт лениво — без ожидания первые кадры отрисуются запасным шрифтом.
// Вызывает точка входа рендера (apps/video); превью в приложении шрифты уже грузит само
export const waitForFonts = () => {
  const handle = delayRender('fonts')
  Promise.all([
    document.fonts.load(`600 100px 'Oswald Variable'`),
    document.fonts.load(`400 40px 'Onest Variable'`),
    document.fonts.load(`600 40px 'Onest Variable'`),
  ]).then(() => continueRender(handle))
}
