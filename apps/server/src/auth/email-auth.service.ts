import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { ENTITY_EMOJI } from '@/common/utils';
import { Prisma, User, VerificationCodeType } from '@/generated/prisma/client';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from 'prisma/prisma.service';

import { UploadService } from '../upload/upload.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailVerificationService } from './email-verification.service';
import { VerificationCodeService } from './verification-code.service';

const BCRYPT_ROUNDS = 11;

// Валидный хэш — для выравнивания тайминга при неизвестном email (считается один раз при старте)
const DUMMY_HASH = bcrypt.hashSync(
  'dummy-password-for-timing-equalization',
  BCRYPT_ROUNDS,
);

@Injectable()
export class EmailAuthService {
  private readonly logger = new Logger(
    `${ENTITY_EMOJI.auth} ${EmailAuthService.name}`,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly mailService: MailService,
    private readonly uploadService: UploadService,
  ) {}

  public async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name: dto.name?.trim() || undefined,
          lastName: dto.lastName?.trim() || undefined,
        },
      });
    } catch (e) {
      // Гонка между pre-check и create
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      throw e;
    }

    // Приглашения применяются только после подтверждения владения почтой (см. EmailVerificationService.verify)
    const emailSent =
      await this.emailVerificationService.sendVerification(user);

    this.logger.log(`Регистрация userId=${user.id} emailSent=${emailSent}`);
    // Токен не выдаём — доступ только после подтверждения email (см. EmailVerificationService.verify)
    return {
      email: user.email,
      emailSent,
      message: emailSent
        ? 'Мы отправили код подтверждения на вашу почту'
        : 'Аккаунт создан, но письмо с кодом отправить не удалось. Запросите код повторно',
    };
  }

  public async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    // Глобальный omit скрывает passwordHash — здесь он нужен, включаем обратно
    const user = await this.prisma.user.findUnique({
      where: { email },
      omit: { passwordHash: false },
    });

    // Одинаковое сообщение и dummy-сравнение при любом исходе — не раскрываем, существует ли email
    if (!user || !user.passwordHash) {
      await bcrypt.compare(dto.password, DUMMY_HASH);
      this.logger.warn(`Неудачный вход: неизвестный email/пароль`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Неудачный вход userId=${user.id}: неверный пароль`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // Верификация email обязательна — без неё токен не выдаём, шлём новый код
    if (!user.emailVerified) {
      const emailSent =
        await this.emailVerificationService.sendVerification(user);
      throw new ForbiddenException(
        emailSent
          ? 'Email не подтверждён. Мы отправили новый код на почту'
          : 'Email не подтверждён. Письмо с кодом отправить не удалось — запросите код повторно',
      );
    }

    this.logger.log(`Вход userId=${user.id}`);
    return this.buildAuthResponse(user);
  }

  public async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });

    // Не раскрываем существование email. Пароля может ещё не быть (аккаунт завёл админ) —
    // сброс и есть способ задать его впервые
    if (user) {
      const code = await this.verificationCodeService.createCode(
        user.id,
        VerificationCodeType.PASSWORD_RESET,
      );
      await this.mailService.sendPasswordResetEmail(email, code);
      this.logger.log(`Запрошен сброс пароля userId=${user.id}`);
    }

    return { message: 'Если email зарегистрирован, письмо с кодом отправлено' };
  }

  public async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Код недействителен или истёк');
    }

    await this.verificationCodeService.verifyCode(
      user.id,
      VerificationCodeType.PASSWORD_RESET,
      dto.code,
    );

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      // Код пришёл на почту — владение ею доказано. Смена версии токена завершает прежние сессии
      data: {
        passwordHash,
        emailVerified: true,
        tokenVersion: { increment: 1 },
      },
    });

    this.logger.log(`Сброшен пароль userId=${user.id}`);
    return { message: 'Пароль изменён' };
  }

  public async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: false },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    await this.verifyCurrentPasswordOrNone(user, dto.currentPassword);

    // Пароль нужен для входа по email — устанавливать его без подтверждённого email смысла нет
    if (!user.passwordHash && (!user.email || !user.emailVerified)) {
      throw new BadRequestException(
        'Сначала подтвердите email, затем можно установить пароль',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    this.logger.log(`Изменён пароль userId=${userId}`);
    // Прежние токены (включая текущий) больше не действуют — отдаём новый, чтобы не разлогинить самого пользователя
    return {
      message: 'Пароль изменён',
      ...(await this.buildAuthResponse(updated)),
    };
  }

  // Удаление безвозвратное: вместе с аккаунтом уходят организации, которыми он владеет.
  // Подтверждение — введённое слово «удалить» (проверяется в DTO) и текущий пароль, если он задан:
  // одного украденного токена для удаления недостаточно
  public async deleteAccount(userId: number, dto: DeleteAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, avatarPath: true },
    });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    await this.verifyCurrentPasswordOrNone(user, dto.currentPassword);

    await this.prisma.$transaction(async (tx) => {
      // Прямые FK без onDelete (владелец, членства) сносим явно, иначе удаление упрётся в ограничения БД
      const ownedOrgs = await tx.organization.deleteMany({
        where: { ownerUserId: userId },
      });
      if (ownedOrgs.count > 0) {
        this.logger.warn(
          `Вместе с аккаунтом userId=${userId} удалены его организации: ${ownedOrgs.count}`,
        );
      }
      await tx.organizationMembership.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    this.uploadService.deleteByRelativePath(user.avatarPath);
    this.logger.log(`Аккаунт удалён userId=${userId}`);
    return { message: 'Аккаунт удалён' };
  }

  // Общая проверка "докажи, что это правда ты" для чувствительных self-service действий
  // (смена пароля, удаление аккаунта). Если пароль уже задан — сверяем его. Если пароля нет
  // (юзер только через Telegram/MAX) — проверять нечего, полагаемся на аутентификацию по гварду.
  public async verifyCurrentPasswordOrNone(
    user: Pick<User, 'passwordHash'>,
    currentPassword?: string,
  ) {
    if (!user.passwordHash) return;

    if (!currentPassword) {
      throw new BadRequestException('Укажите текущий пароль');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }
  }

  public async buildAuthResponse(user: User) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      provider: 'email',
      ver: user.tokenVersion,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
