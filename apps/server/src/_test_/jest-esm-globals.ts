import { jest } from '@jest/globals'

// NestJS 12 поставляется как ESM, тесты идут через --experimental-vm-modules.
// В ESM-режиме Jest не инжектит объект `jest` в глобальную область (в отличие от
// describe/it/expect), поэтому прокидываем его вручную — чтобы спеки звали
// jest.fn()/jest.spyOn() без импорта в каждом файле. Типы берутся из @types/jest.
;(globalThis as typeof globalThis & { jest: typeof jest }).jest = jest
