import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    for (const pattern of allowedOrigins) {
      if (pattern.startsWith('.')) {
        const suffix = pattern.slice(1);
        if (hostname === suffix || hostname.endsWith('.' + suffix)) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

const LOCALHOST_ORIGINS = [
  'https://localhost:5272',
  'http://localhost:5272',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost:5173',
  'https://localhost:5172',
  'http://localhost:5172',
  'https://localhost:10004',
];

export function getCorsConfig(configService: ConfigService): CorsOptions {
  const allowedOriginsRaw = configService.get<string>('HTTP_CORS') ?? '';
  const envOrigins = allowedOriginsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowedOrigins = [...LOCALHOST_ORIGINS, ...envOrigins];

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin, allowedOrigins)) return callback(null, true);

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'recaptcha',
    ],
    exposedHeaders: ['Set-Cookie', 'Content-Disposition'],
  };
}
