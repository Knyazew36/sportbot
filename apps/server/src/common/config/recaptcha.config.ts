// TODO: портированный каркас. Вернуть при подключении reCAPTCHA к /auth/register.
// Требует пакета `@nestlab/google-recaptcha` и env `GOOGLE_RECAPTCHA_SECRET_KEY`.

// import { ConfigService } from '@nestjs/config'
// import { GoogleRecaptchaModuleOptions } from '@nestlab/google-recaptcha'
//
// import { isDev } from '../utils'
//
// export const getRecaptchaConfig = async (configService: ConfigService): Promise<GoogleRecaptchaModuleOptions> => ({
//   secretKey: configService.getOrThrow<string>('GOOGLE_RECAPTCHA_SECRET_KEY'),
//   response: req => req.headers.recaptcha,
//   skipIf: isDev(configService),
// })

export {};
