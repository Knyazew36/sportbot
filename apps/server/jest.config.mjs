// NestJS 12 поставляется как чистый ESM — тесты гоняем в ESM-режиме ts-jest.
// Запуск: yarn test (cross-env NODE_OPTIONS=--experimental-vm-modules jest).
// @nestjs/throttler (6.x, CJS) в тестах подменяется заглушкой — jest-runtime не умеет require() ESM.

/** @type {import('jest').Config} */
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/_test_/jest-esm-globals.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: 'tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@nestjs/throttler$': '<rootDir>/_test_/mocks/nestjs-throttler.ts',
    '^@/(.*)$': '<rootDir>/$1',
    '^src/(.*)$': '<rootDir>/$1',
    '^prisma/(.*)$': '<rootDir>/../prisma/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
}
