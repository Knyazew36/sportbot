import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

import { UploadService } from '../upload.service'

let uploadRoot: string
let service: UploadService

function makeConfigMock(root: string) {
  return { get: (_key: string, fallback?: string) => root ?? fallback } as any
}

function writeTmpFile(bytes: number[]): string {
  const tmpPath = path.join(os.tmpdir(), `upload-test-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`)
  fs.writeFileSync(tmpPath, Buffer.from(bytes))
  return tmpPath
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
const NOT_AN_IMAGE = [0x00, 0x01, 0x02, 0x03]

beforeEach(() => {
  uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-service-root-'))
  service = new UploadService(makeConfigMock(uploadRoot))
})

afterEach(() => {
  fs.rmSync(uploadRoot, { recursive: true, force: true })
})

describe('UploadService', () => {
  it('getCategoryDir создаёт и возвращает поддиректорию категории', () => {
    const dir = service.getCategoryDir('avatars')

    expect(fs.existsSync(dir)).toBe(true)
    expect(dir).toBe(path.join(uploadRoot, 'avatars'))
  })

  describe('verifyImageSignatureOrThrow', () => {
    it('валидная PNG-сигнатура — не бросает и не удаляет файл', () => {
      const tmpPath = writeTmpFile(PNG_HEADER)

      expect(() => service.verifyImageSignatureOrThrow({ path: tmpPath, mimetype: 'image/png' } as any)).not.toThrow()
      expect(fs.existsSync(tmpPath)).toBe(true)

      fs.unlinkSync(tmpPath)
    })

    it('содержимое не соответствует заявленному mime — бросает и удаляет временный файл', () => {
      const tmpPath = writeTmpFile(NOT_AN_IMAGE)

      expect(() => service.verifyImageSignatureOrThrow({ path: tmpPath, mimetype: 'image/png' } as any)).toThrow()
      expect(fs.existsSync(tmpPath)).toBe(false)
    })
  })

  describe('commitToCategory', () => {
    it('переносит файл из стейджинга в категорию и возвращает относительный путь', () => {
      const tmpPath = writeTmpFile(PNG_HEADER)
      const filename = path.basename(tmpPath)

      const relativePath = service.commitToCategory(tmpPath, 'avatars')

      expect(relativePath).toBe(`avatars/${filename}`)
      expect(fs.existsSync(tmpPath)).toBe(false)
      expect(fs.existsSync(path.join(uploadRoot, 'avatars', filename))).toBe(true)
    })
  })

  describe('deleteByRelativePath', () => {
    it('удаляет файл внутри upload root', () => {
      const tmpPath = writeTmpFile(PNG_HEADER)
      const relativePath = service.commitToCategory(tmpPath, 'avatars')

      service.deleteByRelativePath(relativePath)

      expect(fs.existsSync(path.join(uploadRoot, relativePath))).toBe(false)
    })

    it('path traversal за пределы upload root — отказывает и ничего не удаляет', () => {
      const outsideFile = writeTmpFile(PNG_HEADER)

      service.deleteByRelativePath(`../../../../../../..${outsideFile}`)

      expect(fs.existsSync(outsideFile)).toBe(true)

      fs.unlinkSync(outsideFile)
    })

    it('несуществующий файл — не бросает', () => {
      expect(() => service.deleteByRelativePath('avatars/does-not-exist.png')).not.toThrow()
    })

    it('null/undefined — не бросает', () => {
      expect(() => service.deleteByRelativePath(null)).not.toThrow()
      expect(() => service.deleteByRelativePath(undefined)).not.toThrow()
    })
  })

  describe('toPublicUrl', () => {
    it('строит публичный URL из относительного пути', () => {
      expect(service.toPublicUrl('avatars/foo.png')).toBe('/uploads/avatars/foo.png')
    })

    it('null/undefined — возвращает null', () => {
      expect(service.toPublicUrl(null)).toBeNull()
      expect(service.toPublicUrl(undefined)).toBeNull()
    })
  })
})
