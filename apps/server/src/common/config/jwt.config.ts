import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';

export function getJwtConfig(configService: ConfigService): JwtModuleOptions {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      algorithm: 'HS256',
      expiresIn: configService.get<string>(
        'JWT_EXPIRES_IN',
        '7d',
      ) as JwtSignOptions['expiresIn'],
    },
    verifyOptions: {
      algorithms: ['HS256'],
      ignoreExpiration: false,
    },
  };
}
