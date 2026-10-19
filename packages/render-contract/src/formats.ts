/**
 * Во что рендерим. Один формат на всех не годится: прозрачность Android видит, а iPhone — нет
 * (PNG-в-MOV, ProRes 4444 и WebM CapCut на iPhone открыл с фоном; HEVC с альфой на сервере собрать не вышло),
 * там — хромакей
 */
export type RenderFormat = 'mov-alpha' | 'mp4-chroma'

/** Фон, который формат навязывает композиции поверх props пользователя */
export type FormatBackground = 'transparent' | 'chroma'

type FormatSpec = {
  /** Подпись карточки. Называем по фону файла, а не по устройству: «для компьютера» отпугивало тех, кому файл подходит */
  label: string
  /** Пояснение под кнопкой: где этим файлом пользоваться. Уходит и в подпись бота — без точки в конце */
  hint: string
  /** Для какого телефона формат: прозрачность MOV iPhone не видит, там остаётся хромакей */
  badge?: string
  ext: string
  mime: string
  /** Параметры renderMedia из @remotion/renderer */
  codec: 'vp9' | 'prores' | 'h264'
  pixelFormat: 'yuva420p' | 'yuva444p10le' | 'yuv420p'
  imageFormat: 'png' | 'jpeg'
  proResProfile?: '4444'
  background?: FormatBackground
  /**
   * Скорость важнее качества: в роликах плоские плашки с текстом, лишние биты на них не видны.
   * crf — выше значит меньше и грубее; encoderArgs — флаги ffmpeg перед выходным файлом;
   * encoder — подменить кодировщик, которого нет среди codec Remotion (pixelFormat — его формат пикселей)
   */
  encoding?: {
    crf?: number
    x264Preset?: 'veryfast' | 'faster' | 'fast'
    encoderArgs?: string[]
    encoder?: { name: 'png'; pixelFormat: 'rgba' }
  }
  /** Можно отправить ботом: влезает в лимит Bot API 50 МБ */
  chat: boolean
  /** Секунд рендера на секунду ролика — для оценки «сделаем примерно за» */
  renderRate: number
}

export const RENDER_FORMATS: Record<RenderFormat, FormatSpec> = {
  // ProRes 4444 тратит биты на каждый пиксель кадра, даже пустой: 5 с плашки — 20 МБ. PNG-кадры в MOV
  // жмут прозрачное поле почти в ноль: те же 5 с — 3 МБ без потерь. Remotion такого codec не знает —
  // рендерим конвейером ProRes и подменяем кодировщик ffmpeg
  'mov-alpha': {
    label: 'Прозрачный фон, MOV',
    hint: 'Без фона и без потерь качества, около 3 МБ: положи поверх видео — и готово. CapCut на Android и компьютере, Premiere, Final Cut, DaVinci, After Effects',
    badge: 'Для Android',
    ext: 'mov',
    mime: 'video/quicktime',
    codec: 'prores',
    proResProfile: '4444',
    pixelFormat: 'yuva444p10le',
    imageFormat: 'png',
    background: 'transparent',
    encoding: { encoder: { name: 'png', pixelFormat: 'rgba' } },
    chat: true,
    // PNG-кадры отрисовываются дольше JPEG
    renderRate: 2.5,
  },
  // Цветной фон вместо альфы: снимается инструментом «Хромакей» в любом редакторе на телефоне
  'mp4-chroma': {
    label: 'Цветной фон, MP4',
    hint: 'Скачай файл, наложи поверх своего видео и удали фон инструментом «Хромакей» — пипеткой выбери цвет фона. CapCut, InShot и другие',
    // Ни один прозрачный формат CapCut на iPhone не понял: ProRes 4444, PNG-в-MOV и WebM пришли с фоном
    badge: 'Для iPhone',
    ext: 'mp4',
    mime: 'video/mp4',
    codec: 'h264',
    pixelFormat: 'yuv420p',
    imageFormat: 'jpeg',
    background: 'chroma',
    // Края плашки должны остаться чёткими для кеинга — crf не выше 23
    encoding: { crf: 23, x264Preset: 'veryfast' },
    chat: true,
    renderRate: 1.5,
  },
}

// Запуск Chrome и открытие бандла — до первого кадра, от длины ролика не зависит
const RENDER_OVERHEAD_SEC = 6

/**
 * Примерно сколько делается файл, с, без ожидания в очереди. Грубая оценка под сервер на 2 потока —
 * уточнять по логам воркера. Округляем до 5 с: точнее всё равно не угадать
 */
export const renderEstimateSec = (format: RenderFormat, videoSeconds: number) =>
  Math.ceil((RENDER_OVERHEAD_SEC + RENDER_FORMATS[format].renderRate * videoSeconds) / 5) * 5

/** Форматы любого ролика — общие для всех композиций; порядок ключей RENDER_FORMATS — порядок карточек, первый — по умолчанию */
export const RENDER_FORMAT_IDS = Object.keys(RENDER_FORMATS) as RenderFormat[]

/** Props, с которыми композицию рендерят в этом формате: фон задаёт формат, а не пользователь */
export const propsForFormat = <P extends Record<string, unknown>>(props: P, format: RenderFormat): P => {
  const background = RENDER_FORMATS[format].background
  return background ? { ...props, background } : props
}
