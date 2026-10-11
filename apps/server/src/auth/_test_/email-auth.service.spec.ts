import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { EmailAuthService } from '../email-auth.service'

describe('EmailAuthService.changePassword', () => {
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } }
  let service: EmailAuthService

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    }
    service = new EmailAuthService(prisma as any, {} as any, {} as any, {} as any, {} as any)
  })

  it('меняет пароль при верном текущем пароле', async () => {
    const currentHash = await bcrypt.hash('old-password', 11)
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: currentHash,
    })

    const result = await service.changePassword(1, { currentPassword: 'old-password', newPassword: 'new-password-1' })

    expect(result).toEqual({ message: 'Пароль изменён' })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { passwordHash: expect.any(String) },
    })
  })

  it('отклоняет неверный текущий пароль', async () => {
    const currentHash = await bcrypt.hash('old-password', 11)
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: currentHash,
    })

    await expect(
      service.changePassword(1, { currentPassword: 'wrong-password', newPassword: 'new-password-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('требует текущий пароль, если он уже задан', async () => {
    const currentHash = await bcrypt.hash('old-password', 11)
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: currentHash,
    })

    await expect(service.changePassword(1, { newPassword: 'new-password-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })

  it('не даёт установить первый пароль без подтверждённого email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: null,
      emailVerified: false,
      passwordHash: null,
    })

    await expect(service.changePassword(1, { newPassword: 'new-password-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    )
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('позволяет установить первый пароль при подтверждённом email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      emailVerified: true,
      passwordHash: null,
    })

    const result = await service.changePassword(1, { newPassword: 'new-password-1' })

    expect(result).toEqual({ message: 'Пароль изменён' })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { passwordHash: expect.any(String) },
    })
  })
})
