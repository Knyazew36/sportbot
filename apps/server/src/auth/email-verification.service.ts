import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { ENTITY_EMOJI } from '@/common/utils';
import { User, VerificationCodeType } from '@/generated/prisma/client';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';

import { VerificationCodeService } from './verification-code.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auth} ${EmailVerificationService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly jwtService: JwtService,
  ) {}

  /** @returns true, если письмо с кодом реально ушло */
  public async sendVerification(user: User): Promise<boolean> {
    if (!user.email) return false;

    const code = await this.verificationCodeService.createCode(
      user.id,
      VerificationCodeType.EMAIL_VERIFY,
    );
    return this.mailService.sendVerificationEmail(user.email, code);
  }

  public async resendByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Не раскрываем существование email — шлём только если юзер реально есть и ещё не подтверждён
    if (user && !user.emailVerified) {
      await this.sendVerification(user);
      this.logger.log(`Повторно отправлен код подтверждения userId=${user.id}`);
    }
  }

  public async verify(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Та же ошибка, что и при неверном коде — не раскрываем существование email
    if (!user) {
      throw new BadRequestException('Код недействителен или истёк');
    }

    if (user.emailVerified) {
      return { message: 'Email уже подтверждён' };
    }

    await this.verificationCodeService.verifyCode(
      user.id,
      VerificationCodeType.EMAIL_VERIFY,
      code,
    );
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Верификация — единственный момент выдачи токена для нового аккаунта (см. EmailAuthService.register/login)
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      provider: 'email',
      ver: user.tokenVersion,
    });

    this.logger.log(`Email подтверждён userId=${user.id}`);
    return {
      message: 'Email подтверждён',
      accessToken,
      user: { id: user.id, email: user.email },
    };
  }
}
