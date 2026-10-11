import { Test, TestingModule } from '@nestjs/testing'
import { ThrottlerGuard } from '@nestjs/throttler'

import { AuthController } from '../auth.controller'
import { ForgotPasswordDto } from '../dto/forgot-password.dto'
import { LoginDto } from '../dto/login.dto'
import { RegisterDto } from '../dto/register.dto'
import { ResendVerificationDto } from '../dto/resend-verification.dto'
import { ResetPasswordDto } from '../dto/reset-password.dto'
import { VerifyEmailDto } from '../dto/verify-email.dto'
import { EmailAuthService } from '../email-auth.service'
import { EmailVerificationService } from '../email-verification.service'

describe('AuthController', () => {
  let controller: AuthController
  let emailAuthService: EmailAuthService
  let emailVerificationService: EmailVerificationService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: EmailAuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: EmailVerificationService,
          useValue: {
            verify: jest.fn(),
            resendByEmail: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<AuthController>(AuthController)
    emailAuthService = module.get<EmailAuthService>(EmailAuthService)
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('register', () => {
    it('should call emailAuthService.register', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
      }
      await controller.register(dto)
      expect(emailAuthService.register).toHaveBeenCalledWith(dto)
    })
  })

  describe('login', () => {
    it('should call emailAuthService.login', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      }
      await controller.login(dto)
      expect(emailAuthService.login).toHaveBeenCalledWith(dto)
    })
  })

  describe('verifyEmail', () => {
    it('should call emailVerificationService.verify with email and code', async () => {
      const dto: VerifyEmailDto = { email: 'test@example.com', code: '123456' }
      await controller.verifyEmail(dto)
      expect(emailVerificationService.verify).toHaveBeenCalledWith(dto.email, dto.code)
    })
  })

  describe('resendVerification', () => {
    it('should call emailVerificationService.resendByEmail and return success message', async () => {
      const dto: ResendVerificationDto = { email: 'test@example.com' }
      const result = await controller.resendVerification(dto)

      expect(emailVerificationService.resendByEmail).toHaveBeenCalledWith(dto.email)
      expect(result).toEqual({ message: 'Если email зарегистрирован и не подтверждён, письмо отправлено' })
    })
  })

  describe('forgotPassword', () => {
    it('should call emailAuthService.forgotPassword', async () => {
      const dto: ForgotPasswordDto = { email: 'test@example.com' }
      await controller.forgotPassword(dto)
      expect(emailAuthService.forgotPassword).toHaveBeenCalledWith(dto)
    })
  })

  describe('resetPassword', () => {
    it('should call emailAuthService.resetPassword', async () => {
      const dto: ResetPasswordDto = { email: 'test@example.com', code: '123456', newPassword: 'newpassword123' }
      await controller.resetPassword(dto)
      expect(emailAuthService.resetPassword).toHaveBeenCalledWith(dto)
    })
  })
})
