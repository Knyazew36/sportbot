/**
 * Во что рендерим. Один формат на всех не годится: монтажка на компьютере, браузер и телефон
 * понимают прозрачность по-разному — пользователь выбирает кнопку под свой редактор.
 * HEVC с альфой (родной для iPhone) Remotion не кодирует: его умеет только VideoToolbox на macOS
 */
export type RenderFormat = 'prores-alpha' | 'webm-alpha' | 'mp4-chroma' | 'mp4'

/** Фон, который формат навязывает композиции поверх props пользователя */
export type FormatBackground = 'transparent' | 'chroma'

type FormatSpec = {
  /** Подпись кнопки */
  label: string
  /** Пояснение под кнопкой: где этим файлом пользоваться */
  hint: string
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
   * crf — выше значит меньше и грубее; encoderArgs — флаги ffmpeg перед выходным файлом
   */
  encoding?: { crf?: number; x264Preset?: 'veryfast' | 'faster' | 'fast'; encoderArgs?: string[] }
  /** Можно отправить ботом: влезает в лимит Bot API 50 МБ */
  chat: boolean
}

export const RENDER_FORMATS: Record<RenderFormat, FormatSpec> = {
  'prores-alpha': {
    label: 'Для монтажа на компьютере',
    hint: 'MOV ProRes 4444 с прозрачностью — Premiere, Final Cut, DaVinci, After Effects. Тяжёлый: около 20 МБ',
    ext: 'mov',
    mime: 'video/quicktime',
    codec: 'prores',
    proResProfile: '4444',
    pixelFormat: 'yuva444p10le',
    imageFormat: 'png',
    background: 'transparent',
    chat: true,
  },
  'webm-alpha': {
    label: 'Для браузера и CapCut Desktop',
    hint: 'WebM с прозрачностью, около 1 МБ — CapCut Desktop, Canva, браузеры. iPhone прозрачность в нём не видит',
    ext: 'webm',
    mime: 'video/webm',
    codec: 'vp9',
    pixelFormat: 'yuva420p',
    imageFormat: 'png',
    background: 'transparent',
    // libvpx на настройках по умолчанию кодирует альфу в разы дольше отрисовки — realtime в 3–4 раза быстрее
    encoding: { crf: 36, encoderArgs: ['-deadline', 'realtime', '-cpu-used', '8'] },
    chat: true,
  },
  // Цветной фон вместо альфы: снимается инструментом «Хромакей» в любом редакторе на телефоне
  'mp4-chroma': {
    label: 'Для телефона',
    hint: 'MP4 на цветном фоне — CapCut, InShot и другие. Наложи поверх видео и убери фон инструментом «Хромакей»',
    ext: 'mp4',
    mime: 'video/mp4',
    codec: 'h264',
    pixelFormat: 'yuv420p',
    imageFormat: 'jpeg',
    background: 'chroma',
    // Края плашки должны остаться чёткими для кеинга — crf не выше 23
    encoding: { crf: 23, x264Preset: 'veryfast' },
    chat: true,
  },
  mp4: {
    label: 'Обычное видео',
    hint: 'MP4 с фоном — сразу в сторис или ленту',
    ext: 'mp4',
    mime: 'video/mp4',
    codec: 'h264',
    pixelFormat: 'yuv420p',
    imageFormat: 'jpeg',
    encoding: { crf: 23, x264Preset: 'veryfast' },
    chat: true,
  },
}

export const RENDER_FORMAT_IDS = Object.keys(RENDER_FORMATS) as RenderFormat[]

/** Props, с которыми композицию рендерят в этом формате: фон задаёт формат, а не пользователь */
export const propsForFormat = <P extends Record<string, unknown>>(props: P, format: RenderFormat): P => {
  const background = RENDER_FORMATS[format].background
  return background ? { ...props, background } : props
}
