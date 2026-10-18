import { Config } from '@remotion/cli/config'

Config.setEntryPoint('src/index.ts')
// Ролики уходят вставками в чужой монтаж — пусть превью и рендер совпадают по цвету
Config.setVideoImageFormat('png')
