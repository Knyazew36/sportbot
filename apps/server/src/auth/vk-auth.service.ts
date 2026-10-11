import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Prisma } from '@/generated/prisma/client';
import { upsertVkUser, upsertVkUserFromLaunchParams } from '@/common/vk/upsert-vk-user';
import { exchangeVkOAuthCode, fetchVkOAuthUserInfo } from '@/common/vk/vk-oauth-client';
import { ENTITY_EMOJI } from '@/common/utils';
import { PrismaService } from 'prisma/prisma.service';

import { VkMiniAppDto } from './dto/vk-miniapp.dto';
import { VkOAuthTokenDto } from './dto/vk-oauth-token.dto';
import { VkOAuthDto } from './dto/vk-oauth.dto';

@Injectable()
export class VkAuthService {
  private readonly logger = new Logger(VkAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Вход/регистрация через VK Mini App: проверяем подпись launch-параметров, upsert по vkUserId, выдаём JWT. */
  public async loginWithMiniApp(dto: VkMiniAppDto) {
    const secret = this.configService.get<string>('VK_APP_SECRET') ?? '';
    const user = await upsertVkUserFromLaunchParams(
      this.prisma,
      dto.launchParams,
      secret,
      dto.profile,
    );

    this.logger.log(`${ENTITY_EMOJI.auth} VK Mini App вход userId=${user.id}`);
    return this.buildAuthResponse(user.id);
  }

  /** Вход через VK ID OAuth (редирект + PKCE): обмениваем code на токен, тянем профиль, upsert по vkUserId, выдаём JWT. */
  public async loginWithOAuth(dto: VkOAuthDto) {
    const clientId = this.configService.get<string>('VK_ID_APP_ID') ?? '';

    const token = await exchangeVkOAuthCode({
      code: dto.code,
      codeVerifier: dto.codeVerifier,
      deviceId: dto.deviceId,
      redirectUri: dto.redirectUri,
      state: dto.state,
      clientId,
    });

    const info = await fetchVkOAuthUserInfo(token.accessToken, clientId);
    const user = await upsertVkUser(
      this.prisma,
      BigInt(info.vkUserId),
      info.raw as Prisma.InputJsonValue,
    );

    this.logger.log(
      `${ENTITY_EMOJI.auth} VK OAuth вход userId=${user.id} vkUserId=${info.vkUserId}`,
    );
    return this.buildAuthResponse(user.id);
  }

  /**
   * Вход через VK ID SDK-виджет (OneTap/FloatingOneTap): access_token уже получен
   * на клиенте через VKID.Auth.exchangeCode, тут только тянем профиль, upsert, JWT.
   */
  public async loginWithOAuthToken(dto: VkOAuthTokenDto) {
    const clientId = this.configService.get<string>('VK_ID_APP_ID') ?? '';

    const info = await fetchVkOAuthUserInfo(dto.accessToken, clientId);
    const user = await upsertVkUser(
      this.prisma,
      BigInt(info.vkUserId),
      info.raw as Prisma.InputJsonValue,
    );

    this.logger.log(
      `${ENTITY_EMOJI.auth} VK ID SDK вход userId=${user.id} vkUserId=${info.vkUserId}`,
    );
    return this.buildAuthResponse(user.id);
  }

  private async buildAuthResponse(userId: number) {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      provider: 'vk',
    });
    return { accessToken, user: { id: userId } };
  }
}
