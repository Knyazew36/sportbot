import { DocumentBuilder } from '@nestjs/swagger';

// Теги — латиницей (иначе orval генерит названия хуков/файлов кириллицей),
// человекочитаемое описание — вторым аргументом addTag, его показывает Swagger UI.
export function getSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('api')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Авторизация')
    .addTag('organizations', 'Организации')
    .addTag('categories', 'Категории продуктов')
    .addTag('products', 'Продукты')
    .build();
}
