import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Swagger } from '@/common/decorators/swagger/swagger.decorator';
import { MultiAuthGuard } from '@/common/guards/multi-auth.guard';

import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TelegramWidgetAuthDto } from './dto/telegram-widget.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VkMiniAppDto } from './dto/vk-miniapp.dto';
import { VkOAuthTokenDto } from './dto/vk-oauth-token.dto';
import { VkOAuthDto } from './dto/vk-oauth.dto';
import { EmailAuthService } from './email-auth.service';
import { EmailVerificationService } from './email-verification.service';
import { TelegramAuthService } from './telegram-auth.service';
import { VkAuthService } from './vk-auth.service';

// Публичные эндпоинты (без MultiAuthGuard), защищены троттлингом от перебора
@ApiTags('auth')
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly emailAuthService: EmailAuthService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly vkAuthService: VkAuthService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly authService: AuthService,
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

  // --- VK Mini App ---

  @Post('vk/miniapp')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Swagger({
    title: 'Вход через VK Mini App (проверка подписи launch-параметров)',
    body: VkMiniAppDto,
  })
  vkMiniApp(@Body() dto: VkMiniAppDto) {
    return this.vkAuthService.loginWithMiniApp(dto);
  }

  @Post('vk/oauth')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Swagger({
    title: 'Вход через VK ID OAuth (редирект + PKCE, обмен code на JWT)',
    body: VkOAuthDto,
  })
  vkOAuth(@Body() dto: VkOAuthDto) {
    return this.vkAuthService.loginWithOAuth(dto);
  }

  @Post('vk/oauth/token')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Swagger({
    title: 'Вход через VK ID SDK-виджет (обмен уже полученного access_token на JWT)',
    body: VkOAuthTokenDto,
  })
  vkOAuthToken(@Body() dto: VkOAuthTokenDto) {
    return this.vkAuthService.loginWithOAuthToken(dto);
  }

  // --- Telegram (не мини-апп) ---

  @Post('telegram/widget')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Swagger({
    title: 'Вход через Telegram Login Widget (проверка подписи данных от Telegram)',
    body: TelegramWidgetAuthDto,
  })
  telegramWidget(@Body() dto: TelegramWidgetAuthDto) {
    return this.telegramAuthService.loginWithWidget(dto);
  }

  // --- Аутентифицированные ---

  @Get('me')
  @UseGuards(MultiAuthGuard)
  @Swagger({
    title: 'Профиль текущего пользователя + вычисленные capabilities',
    bearerAuth: true,
  })
  me(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @Post('change-password')
  @UseGuards(MultiAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Swagger({
    title: 'Смена пароля авторизованным пользователем',
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
    title: 'Удалить аккаунт после ввода фразы «удалить» (мягкое удаление)',
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
