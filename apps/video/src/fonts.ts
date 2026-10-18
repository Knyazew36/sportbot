import '@fontsource-variable/oswald'
import '@fontsource-variable/onest'
import { continueRender, delayRender } from 'remotion'

// Fontsource грузит шрифт лениво — без ожидания первые кадры отрисуются запасным шрифтом
const handle = delayRender('fonts')
Promise.all([
  document.fonts.load(`600 100px 'Oswald Variable'`),
  document.fonts.load(`400 40px 'Onest Variable'`),
  document.fonts.load(`600 40px 'Onest Variable'`),
]).then(() => continueRender(handle))
