import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { StartedTestContainer } from 'testcontainers'

import { UploadService } from '../../upload/upload.service'
import { cleanupDb, setupTestDb } from '../../_test_/test-db'
import { ChatService } from '../chat.service'

let container: StartedTestContainer
let prisma: PrismaClient
let service: ChatService
let uploadRoot: string
let uploadService: UploadService

const botMaxServiceMock = { sendMessage: jest.fn() } as any

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]

function makeMulterFile(bytes: number[], mimetype = 'image/png'): Express.Multer.File {
  const tmpPath = path.join(os.tmpdir(), `chat-test-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`)
  fs.writeFileSync(tmpPath, Buffer.from(bytes))
  return { path: tmpPath, mimetype } as Express.Multer.File
}

const flush = () => new Promise(resolve => setTimeout(resolve, 50))

beforeAll(async () => {
  const db = await setupTestDb()
  container = db.container
  prisma = db.prisma
}, 60_000)

afterAll(async () => {
  await prisma.$disconnect()
  await container.stop()
})

beforeEach(async () => {
  await cleanupDb(prisma)
  botMaxServiceMock.sendMessage.mockReset()
  botMaxServiceMock.sendMessage.mockResolvedValue(undefined)
  uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-upload-root-'))
  uploadService = new UploadService({ get: () => uploadRoot } as any)
  service = new ChatService(prisma as any, uploadService, botMaxServiceMock)
})

afterEach(() => {
  fs.rmSync(uploadRoot, { recursive: true, force: true })
})

describe('ChatService.create', () => {
  it('создаёт заявку без файлов', async () => {
    const result = await service.create({ message: 'Привет', phone: '+79990000001' } as any, [])

    expect(result.message).toBe('Привет')
    expect(result.fileUrls).toEqual([])
    expect(await prisma.chatSubmission.count()).toBe(1)
  })

  it('создаёт заявку с файлами — файлы переносятся в категорию chat', async () => {
    const file = makeMulterFile(PNG_HEADER)

    const result = await service.create({ message: 'С фото', email: 'a@test.local' } as any, [file])

    expect(result.fileUrls).toHaveLength(1)
    expect(result.fileUrls[0]).toMatch(/^\/uploads\/chat\//)
    expect(fs.existsSync(file.path)).toBe(false)
    const submission = await prisma.chatSubmission.findFirstOrThrow()
    expect(submission.filePaths[0]).toMatch(/^chat\//)
    expect(fs.existsSync(path.join(uploadRoot, submission.filePaths[0]))).toBe(true)
  })

  it('файл не соответствует заявленной сигнатуре — бросает, БД не меняется, временный файл удалён', async () => {
    const badFile = makeMulterFile([0x00, 0x01, 0x02, 0x03])

    await expect(service.create({ message: 'Плохое фото', email: 'a@test.local' } as any, [badFile])).rejects.toThrow()

    expect(fs.existsSync(badFile.path)).toBe(false)
    expect(await prisma.chatSubmission.count()).toBe(0)
  })

  it('уведомляет активных IT-пользователей с maxId после создания заявки', async () => {
    await prisma.user.create({ data: { email: 'it@test.local', name: 'IT', isIT: true, maxId: '111' } })
    await prisma.user.create({ data: { email: 'it-no-max@test.local', name: 'IT без max', isIT: true, maxId: null } })
    await prisma.user.create({ data: { email: 'user@test.local', name: 'Обычный', isIT: false, maxId: '222' } })

    await service.create({ message: 'Проблема', phone: '+79990000002' } as any, [])
    await flush()

    expect(botMaxServiceMock.sendMessage).toHaveBeenCalledTimes(1)
    expect(botMaxServiceMock.sendMessage.mock.calls[0][0]).toBe('111')
    expect(botMaxServiceMock.sendMessage.mock.calls[0][1]).toContain('Проблема')
  })

  it('нет IT-пользователей — sendMessage не вызывается', async () => {
    await service.create({ message: 'Без адресата', phone: '+79990000003' } as any, [])
    await flush()

    expect(botMaxServiceMock.sendMessage).not.toHaveBeenCalled()
  })

  it('ошибка уведомления IT не приводит к падению create', async () => {
    await prisma.user.create({ data: { email: 'it@test.local', name: 'IT', isIT: true, maxId: '111' } })
    botMaxServiceMock.sendMessage.mockRejectedValueOnce(new Error('boom'))

    const result = await service.create({ message: 'Ок несмотря на сбой', phone: '+79990000004' } as any, [])
    await flush()

    expect(result.message).toBe('Ок несмотря на сбой')
  })
})
