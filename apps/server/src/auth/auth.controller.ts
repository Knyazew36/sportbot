import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';

import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailAuthService } from './email-auth.service';
import { EmailVerificationService } from './email-verification.service';

// Публичные эндпоинты (без MultiAuthGuard). Троттлинг — глобальный ThrottlerGuard из AppModule,
// @Throttle на ручках только ужесточает лимит против перебора
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailAuthService: EmailAuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Swagger({
    title: 'Регистрация по email и паролю',
    body: RegisterDto,
    response: RegisterResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.emailAuthService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Swagger({
    title: 'Вход по email и паролю',
    body: LoginDto,
  })
  login(@Body() dto: LoginDto) {
    return this.emailAuthService.login(dto);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Swagger({
    title: 'Подтверждение email по коду из письма',
    body: VerifyEmailDto,
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verify(dto.email, dto.code);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Swagger({
    title: 'Повторная отправка кода подтверждения email',
    body: ResendVerificationDto,
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.emailVerificationService.resendByEmail(dto.email);

    return {
      message: 'Если email зарегистрирован и не подтверждён, письмо отправлено',
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Swagger({
    title: 'Запросить код для сброса пароля',
    body: ForgotPasswordDto,
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.emailAuthService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Swagger({
    title: 'Сброс пароля по коду из письма',
    body: ResetPasswordDto,
  })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.emailAuthService.resetPassword(dto);
  }

  // --- Аутентифицированные ---

  @Post('change-password')
  @UseGuards(MultiAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Swagger({
    title:
      'Смена пароля авторизованным пользователем (прежние сессии завершаются, в ответе новый токен)',
    body: ChangePasswordDto,
    bearerAuth: true,
  })
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.emailAuthService.changePassword(userId, dto);
  }

  @Post('delete-account')
  @UseGuards(MultiAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Swagger({
    title:
      'Удалить аккаунт безвозвратно: слово «удалить» и текущий пароль, если он задан',
    body: DeleteAccountDto,
    bearerAuth: true,
  })
  deleteAccount(
    @CurrentUser('id') userId: number,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.emailAuthService.deleteAccount(userId, dto);
  }
}
